
import 'regenerator-runtime/runtime'


import { initNEAR, login, logout,
		// getContentOf, hasAccessTo, 
		getProfileOf, getMyInfluencers,
         subscribeTo, upload_file_to_sia, updateMyProfile,
         addToMyContent,deleteFromMyContent } from './blockchain'

window.login = login;

window.logout = logout;

// Harcoded influencer for now
const spinner = '<i class="fas fa-sync fa-spin"></i>'; 
window.$contentGrid = null;
let $influencerGrid, $searchGrid;
let avatarPlaceholder, bannerPlaceholder;

$(document).ready(function () {

    // ------------------------------------------------------
    // ADD CONTENT EVENTS
    // ------------------------------------------------------
    
    $("#upload-content-input").change(function() {
    	uploadFilePreview(this,(preview,type)=>{
    		$(`#upload-content-preview-${type}`).attr('src', preview);
	      	$(`#upload-content-preview-${type}`).show();
		    $('.btn-upload').hide();
    	});
	});

	avatarPlaceholder = $('#influencer-avatar').attr('src');
	bannerPlaceholder = $('#influencer-banner').attr('src');

	$("#add-content-btn").click(async function(){
		let contentFile = $("#upload-content-input").prop('files');
		if (contentFile && contentFile[0]){
			$("#add-content-btn").html('Uploading... '+spinner);
			let link = await upload_file_to_sia(contentFile[0])
			var caption = $("#content-title-input").val();
			await addToMyContent('https://siasky.net/'+link,caption);
			// show new content on profile
			$("#add-content-modal").modal('hide');
			$("#add-content-btn").html('Add content');
			showProfile();
			// var img = $('#upload-content-preview').attr('src');
			// should upload to sia
			// serverAddContent(img,$("#content-title-input").val());
			// show new content on profile
			// showProfile()
		}
	});

	$("#add-content-modal").on("show.bs.modal", function () { 
		$('#upload-content-preview-image').attr('src',"#");
		$('#upload-content-preview-video').attr('src',"#");
		$('#upload-content-preview-image').hide();
		$('#upload-content-preview-video').hide();
        $("#upload-content-input").val('');
        $('.btn-upload').show();
	})

	// ------------------------------------------------------
    // EDIT PROFILE EVENTS
    // ------------------------------------------------------

    $("#upload-banner-input").change(function() {
		uploadFilePreview(this,(preview)=>{
			$('#edit-banner-img').attr('src', preview);
    	});
	});

	$("#upload-avatar-input").change(function() {
		uploadFilePreview(this,(preview)=>{
			$('#edit-avatar-img').attr('src', preview);
    	});
	});

    $("#edit-profile-modal").on("show.bs.modal", async function () { 
    	// set profile to edit
    	let influencerProfile = await getProfileOf(accountId);
    	if (!influencerProfile){
    		influencerProfile = {
    			name: "",
    			profile: "",
    			price: 30,
    			avatar: avatarPlaceholder,
    			banner: bannerPlaceholder
    		}
    	} 
		$("#influencer-name-input").val(influencerProfile.name)
		$("#influencer-profile-input").val(influencerProfile.profile)
		$("#influencer-price-input").val(influencerProfile.price)
		$("#edit-avatar-img").attr('src',influencerProfile.avatar)
		$("#edit-banner-img").attr('src',influencerProfile.banner)
		
	});

	$("#edit-profile-save").click(function(){
		var name = $("#influencer-name-input").val();
		var description = $("#influencer-profile-input").val();
		var price = $("#influencer-price-input").val();
		var avatarFiles = $("#upload-avatar-input").prop('files');
		var bannerFiles = $("#upload-banner-input").prop('files');
		
		if ($('#become-influencer-btn').is(":visible")){
			$("#become-influencer-btn").hide();
    		$(".influencer-btn").show();
		}
		
		
		if (avatarFiles && avatarFiles[0]
			&& bannerFiles && bannerFiles[0]){
			var uploads = [
				upload_file_to_sia(avatarFiles[0]),
				upload_file_to_sia(bannerFiles[0])
			]
			$("#edit-profile-save").html('Saving... '+spinner);
			Promise.all(uploads).then(async links => {
				await updateMyProfile(name, 'https://siasky.net/'+links[1], 'https://siasky.net/'+links[0], description, price)
				accountProfile = await getProfileOf(accountId);
				$("#edit-profile-modal").modal('hide');
				$("#edit-profile-save").html("Save changes");
				showProfile();
			})
		} else {
			console.log("no avatar or banner")
			// error no avatar or banner
		}
	})

	// ------------------------------------------------------
    // INIT SIDEBAR 
    // ------------------------------------------------------

	$("#sidebar").mCustomScrollbar({
        theme: "minimal"
    });

    // $('#dismiss, .overlay, .nav-btn').on('click', function () {
    //     $('#sidebar').removeClass('active');
    //     $('.overlay').removeClass('active');
    // });

    // $('#sidebarCollapse').on('click', function () {
    //     $('#sidebar').addClass('active');
    //     $('.overlay').addClass('active');
    //     $('.collapse.in').toggleClass('in');
    //     $('a[aria-expanded=true]').attr('aria-expanded', 'false');
    // });

	// ------------------------------------------------------
    // INIT GRIDS 
    // ------------------------------------------------------


    // $influencerGrid = initiateGrid('.featured-influencers');
    $contentGrid = initiateGrid('.content-gallery');
    // $searchGrid = initiateGrid('.search-gallery');

	// ------------------------------------------------------
    // INIT LIGHTBOX GALLERY 
    // ------------------------------------------------------
    
    $(document).on('click', '[data-toggle="lightbox"]', function(event) {
        event.preventDefault();
        $(this).ekkoLightbox();
    });
        	

    window.nearInitPromise = initNEAR()
    .then(connected => { if (connected) loginFlow()
                         else logoutFlow() })

});

// ------------------------------------------------------
// USER LOGGED IN
// ------------------------------------------------------

async function loginFlow() {
	$("#logged-out").hide();
    $("#logged-in").show();
    $(".logged-user-name").html(accountId);
    console.log("Getting profile")
	getProfileOf(accountId).then(profile=>{
		console.log(profile)
		window.accountProfile = profile;
		if (accountProfile) {
	    	$(".influencer-btn").show();
	    } else {
	    	$("#become-influencer-btn").show();
	    }
	})
	console.log("Subscription content")
	showSubscriptionContent();
}

function logoutFlow(){
	$("#logged-in").hide();
    $("#logged-out").show();
}

// ------------------------------------------------------
// GRID MANAGEMENT
// ------------------------------------------------------

function initiateGrid(gridClass){
	var $grid = $(gridClass).masonry({
        temSelector: '.grid-item',
        columnWidth: '.grid-sizer',
        percentPosition: true,
    });

    // Initate imagesLoaded
    $grid.imagesLoaded().progress( function() {
        $grid.masonry('layout');
    });
    return $grid;
}

// ------------------------------------------------------
// FILE MANAGEMENT
// ------------------------------------------------------


function uploadFilePreview(uploader,callback){
	// upload file in frontend and show preview
	if (uploader.files && uploader.files[0]) {
		console.log(uploader.files[0]);
		if (uploader.files[0].type.includes('video')){
			var fileUrl = URL.createObjectURL(uploader.files[0]);
   			
   			callback(fileUrl,'video')
		} else {
			var reader = new FileReader();
		    reader.onload = function(e) {
		      callback(e.target.result,'image')
		    }
		    reader.readAsDataURL(uploader.files[0]); // convert to base64 string
		}

	   //  	var $source = $('#video_here');
		  // $source[0].src = URL.createObjectURL(this.files[0]);
		  // $source.parent()[0].load();
	    
    }
}

// ------------------------------------------------------
// FIND INFLUENCERS
// ------------------------------------------------------

window.searchInfluencers = async function(){
	var name = $('#influencerSearch').val();
	$('#search-btn').html('Searching... '+spinner)
	
	var influencerProfile = await getProfileOf(name);
	$('#search-btn').html('Search');
	$('#influencerSearch').val("")
	if (influencerProfile) {
		showProfile(name,influencerProfile);
	} 
}


window.seeFeaturedInfluencers = function(){
	$("#search-results").hide();
	$("#featured-influencers").show();
}

window.subscribeToInfluencer = async function(){
	var target = $(".subscribe-btn").attr('target');
	var price = $(".subscribe-btn").attr('price');
	await subscribeTo(target,price);
	var influencerProfile = await getProfileOf(target);
	showProfile(target,influencerProfile);
}

// ------------------------------------------------------
// PAGE NAVIGATION
// ------------------------------------------------------

window.showSubscriptionContent = async function showSubscriptionContent() {
	$("#influencer-profile").hide();
	$("#influencer-content").hide();
	$("#my-subs-banner").show();

	$("#my-subs-banner").find(".lead").hide();
	$("#my-subs-banner").find(".loading-subs").show();
	var subs = await getMyInfluencers();
	if (!subs.length){
		$("#my-subs-banner").find(".loading-subs").hide();
		$("#my-subs-banner").find(".has-no-subs").show();
		return;
	}
	// $("#find-influencers").hide();
	
	$("#my-subs-banner").show();
	let content = [];
	subs.forEach(profile=>{
		console.log(profile);
		content = content.concat(addOwner(profile.content,profile.id,profile.name))
	});
	console.log(subs)
	console.log(content)
	// Promise.all(content).then(subsContent => {
		// console.log(subsContent);
		// var allContent = [];
		// subsContent.forEach((posts,index)=>{
		// 	allContent = allContent.concat(addOwner(posts, subs[index]))
		// })
	$("#my-subs-banner").find(".loading-subs").hide();
	$("#my-subs-banner").find(".has-subs").show();
	showContentInGrid(content,false);
	// })
}

// window.showFindInfluencers = function showFindInfluencers() {
// 	$("#influencer-profile").hide();
// 	$("#influencer-content").hide();
// 	$("#search-results").hide();
// 	$("#my-subs-banner").hide();
// 	$("#find-influencers").show();
// 	// TODO: show featured influencers
// 	// var featured = serverGetFeatured();
// 	// $("#featured-influencers").show();
// 	// setInfluencersList(featured,'featured-influencer',$influencerGrid)
// 	$("#featured-influencers").hide();
// 	$("#discover-btn").hide();
	
// }

// function setInfluencersList(influencers,section,$grid){
// 	$(`.${section}`).remove()
// 	influencers.forEach(f=>{
// 		var inf = $('.influencer-list-template').clone();
// 		inf.find('img').attr('src',f.avatar)
// 		inf.find('.influencer-link').attr('target',f.id);
// 		inf.find('.influencer-name').html(f.name);
// 		inf.removeClass('influencer-list-template');
// 		inf.addClass(section);
// 		$grid.append(inf).masonry( 'appended', inf ).masonry();
// 	})
// 	$(".influencer-link").click(async function(){
// 		var influencer = $(this).attr('target');
// 		var influencerProfile = await getProfileOf(influencer)
// 		showProfile(influencer,influencerProfile);
// 	})
// }

function profileChanged(p1,p2){
	var props = ['name','description','banner','avatar','fans'];
	var isEqual = props.reduce((prev,prop)=> {return prev && p1[prop]===p2[prop]},true);
	function sameContent(c1,c2){
		if (c1.length != c2.length) return false;
		return c1.reduce((prev,c,i)=>{return prev && c1[i].sialink === c2[i].sialink},true)
	}
	return !isEqual || !(sameContent(p1.content, p2.content)); 
}

window.showProfile = async function showProfile(influencerId,influencerProfile) {
	if (!influencerId){
		influencerId = accountId;
		influencerProfile = accountProfile;
		getProfileOf(accountId).then(profile=>{
			// show profile as it is but look for changes
			if (profileChanged(accountProfile,profile)){
				accountProfile = profile;
				showProfile(accountId,accountProfile);
			} 
		});
	}
	// $("#find-influencers").hide();
	$("#my-subs-banner").hide();
	
	$(".influencer-name").html(influencerProfile.name);
	$(".influencer-description").html(influencerProfile.description);
	$("#influencer-followers").html(influencerProfile.fans);
	
	
	$(".subscribe-btn").attr('target',influencerId);
	$(".subscribe-btn").attr('price',influencerProfile.price);
	$(".subscribe-btn").html(`Subscribe for ${influencerProfile.price}(N) per month to see all the content!`);
	$(".subscribe-btn").hide();

	$("#influencer-content").hide();
	$('#loading-influencer-content').hide();
	// $('#loading-influencer-content').show();
	// $('#loading-influencer-content').html("Loading content... "+spinner);

	var loaderCounter = 0;
	function showAfterTwo(){
		loaderCounter++;
		if(loaderCounter==2){
			$("#influencer-profile").show();
			if (!influencerProfile.hasAccess) {
				$(".subscribe-btn").show();
				// $("#influencer-content").hide();
			} else {
				var content = influencerProfile.content;
				// var content = await getContentOf(influencerId);
				if (!content.length){
					$('#loading-influencer-content').show()
					$('#loading-influencer-content').html(`${influencerProfile.name} doesn't have any content yet!`)
				} else {
					showContentInGrid(addOwner(content,influencerId,influencerProfile.name),true);
				}
			}
		}
	}
	$("#influencer-avatar").attr('src',influencerProfile.avatar).on('load', showAfterTwo);
	$("#influencer-banner").attr('src',influencerProfile.banner).on('load', showAfterTwo);

	
	// var hasAcces = await hasAccessTo(influencerId);
	
}

function addOwner(content, id,name){
	if (!name) name = id;
	return content.map(c=>{return {ownerId:id,ownerName:name,...c} })
}

function showContentInGrid(content,inProfile) {
	content.sort((c1,c2)=>c1.creationDate<c2.creationDate);
	$(".single-content").remove();
	$("#influencer-content").show();
	content.forEach(c=>showSingleContent(c,inProfile));
    
}

function checkSiaLinkType(sialink){
	return new Promise(resolve=>{
		$.ajax({
		  type: "HEAD",
		  url : sialink,
		  success: function(message,text,response){
		  	resolve(response.getResponseHeader('Content-Type'))
		  } 
		});
	})
	
}

function showSingleContent(content,inProfile) {
	var newContent = $(".content-template").clone();
	newContent.find('.main-content').attr('href',content.sialink)
	checkSiaLinkType(content.sialink).then(contentType=>{
		if (contentType.includes('image')){
			newContent.find('video').remove();	
			newContent.find('img').attr('src',content.sialink).on('load', function () {
				$contentGrid.masonry();
			});
		} else {
			newContent.find('img').remove();
			newContent.find('video').attr('src',content.sialink)
			newContent.find('video').attr('type',contentType);
			$contentGrid.masonry();
		}
	})
	
	
	newContent.find('h2').html(content.description);
	let date = new Date(content.creationDate/1000000)
	newContent.find('.small').html("Uploaded on "+date.toDateString());
	if (!inProfile){
		newContent.find('.visit-influencer-btn').attr('target',content.ownerId);
		newContent.find('.visit-influencer-btn').html("Visit "+content.ownerName);
		newContent.find('.remove-content-btn').remove();
		newContent.find('.visit-influencer-btn').click(async function(){
			var target = $(this).attr('target');
			var influencerProfile = await getProfileOf(target)
			showProfile(target,influencerProfile);
		});
	} else {
		newContent.find('.visit-influencer-btn').remove();
		if (content.ownerId != accountId){
			newContent.find('.remove-content-btn').remove();
		} else {
			newContent.find('.remove-content-btn').attr('target',content.sialink);
			newContent.find('.remove-content-btn').click(function(){
				var target = $(this).attr('target');
				deleteFromMyContent(target).then(()=>{
					showProfile()
				});
			});
		}
	}
	newContent.addClass("single-content");
	newContent.removeClass("content-template");
	newContent.removeClass("d-none");
	$contentGrid.append(newContent).masonry( 'appended', newContent );

}
