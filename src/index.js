
import 'regenerator-runtime/runtime'


import { initNEAR, login, logout,
		getProfileOf, getMyInfluencers,
         subscribeTo, upload_file_to_sia, updateMyProfile,
         addToMyContent,deleteFromMyContent, generateUUID } from './blockchain'

window.login = login;

window.logout = logout;

// Harcoded influencer for now
const spinner = '<i class="fas fa-sync fa-spin"></i>'; 
window.$contentGrid = null;
window.currentSection = "subscriptionContent"
let avatarPlaceholder, bannerPlaceholder, subs = null;

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


	$("#edit-profile-save").click(function(){
		$("#edit-profile-save").html("Saving... "+spinner);
		var name = $("#influencer-name-input").val();
		var description = $("#influencer-profile-input").val();
		var price = $("#influencer-price-input").val();
		var avatar = accountProfile ? accountProfile.avatar : $('#edit-avatar-img').attr('src');
		var banner = accountProfile ? accountProfile.banner : $('#edit-banner-img').attr('src');

		async function updateProfile(){
			await updateMyProfile(name, banner, avatar, description, price)
			accountProfile = await getProfileOf(accountId);
			$("#edit-profile-modal").modal('hide');
			$("#edit-profile-save").html("Save changes");
			if ($('#become-influencer-btn').is(":visible")){
				$("#become-influencer-btn").hide();
	    		$(".influencer-btn").show();
			}
			showProfile();
		}
		
		
		
		var avatarFiles = $("#upload-avatar-input").prop('files');
		var bannerFiles = $("#upload-banner-input").prop('files');
		var uploads = {keys:{},files:[]};
		if (avatarFiles && avatarFiles[0]){
			uploads.keys.avatar = true;
			uploads.files.push(upload_file_to_sia(avatarFiles[0]))
		}
		if (bannerFiles && bannerFiles[0]){
			uploads.keys.banner = true;
			uploads.files.push(upload_file_to_sia(bannerFiles[0]))
		}
		if (uploads.files.length==0){
			// nothing to upload;
			return updateProfile();
		}
		Promise.all(uploads.files).then(async links => {
			
			if (uploads.keys.avatar){
				avatar = 'https://siasky.net/'+links[0];
				if (uploads.keys.banner){
					banner = 'https://siasky.net/'+links[1];
				}
			} else {
				banner = 'https://siasky.net/'+links[0];
			}
			updateProfile();
		})
	});


	// ------------------------------------------------------
    // SEARCH BAR
    // ------------------------------------------------------

	$("#influencerSearch").on('keyup', function (e) {
	    if (e.key === 'Enter' || e.keyCode === 13) {
	        searchInfluencers()
	    }
	});

	// ------------------------------------------------------
    // INIT GRIDS 
    // ------------------------------------------------------

    $contentGrid = $('.content-gallery').masonry({
        temSelector: '.grid-item',
        columnWidth: '.grid-sizer',
        percentPosition: true,
    });

    // Initate imagesLoaded
    $contentGrid.imagesLoaded().progress( function() {
        $contentGrid.masonry('layout');
    });

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
	$("#starting").hide();
  $("#logged-in").show();
  $(".logged-user-name").html(accountId);
	getProfileOf(accountId).then(profile=>{
		window.accountProfile = profile;
		if (accountProfile) {
	    	$(".influencer-btn").show();
	    } else {
	    	$("#become-influencer-btn").show();
	    }
	})
	showSubscriptionContent();
}

function logoutFlow(){
	$("#starting").hide();
  $("#logged-out").show();
}

// ------------------------------------------------------
// FILE MANAGEMENT
// ------------------------------------------------------


function uploadFilePreview(uploader,callback){
	// upload file in frontend and show preview
	if (uploader.files && uploader.files[0]) {
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
	    
    }
}

// ------------------------------------------------------
// FIND INFLUENCERS
// ------------------------------------------------------

window.searchInfluencers = async function(){
	var name = $('#influencerSearch').val();
	$('#influencerSearch').val("Searching...");
	// $('#search-btn').html('Searching... '+spinner)
	
	var influencerProfile = await getProfileOf(name);
	// $('#search-btn').html('Search');
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
	var nextSection = generateUUID();
	currentSection = nextSection.toString();
	$("#loading-influencer-content").hide();
	$("#influencer-profile").hide();
	$("#influencer-content").hide();
	$("#my-subs-banner").show();

	$("#my-subs-banner").find(".lead").hide();
	$("#my-subs-banner").find(".loading-subs").show();
	if (!subs){
		subs = await getMyInfluencers();
	}
	
	if (!subs.length){
		$("#my-subs-banner").find(".loading-subs").hide();
		$("#my-subs-banner").find(".has-no-subs").show();
		return;
	}
	
	$("#my-subs-banner").show();
	let content = [];
	subs.forEach(profile=>{
		content = content.concat(addOwner(profile.content,profile.id,profile.name))
	});

	$("#my-subs-banner").find(".loading-subs").hide();
	$("#my-subs-banner").find(".has-subs").show();
	showContentInGrid(content,false,nextSection.toString());
}

function profileChanged(p1,p2){
	var props = ['name','description','banner','avatar','fans'];
	var isEqual = props.reduce((prev,prop)=> {return prev && p1[prop]===p2[prop]},true);
	function sameContent(c1,c2){
		if (c1.length != c2.length) return false;
		return c1.reduce((prev,c,i)=>{return prev && c1[i].sialink === c2[i].sialink},true)
	}
	return !isEqual || !(sameContent(p1.content, p2.content)); 
}


window.editProfile = async function editProfile(){
	$("#loading-profile-content").show()
	$("#edit-profile-content").hide();
	$("#edit-profile-save").hide();
	$("#edit-profile-modal").modal('show');
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
	var loaderCounter = 0;
	function showAfterTwo(){
		loaderCounter++;
		if(loaderCounter==2){
			$("#loading-profile-content").hide()
			$("#edit-profile-content").show();
			$("#edit-profile-save").show();
		}
	}
	$("#edit-avatar-img").attr('src',influencerProfile.avatar).on('load', showAfterTwo);
	$("#edit-banner-img").attr('src',influencerProfile.banner).on('load', showAfterTwo);
}

window.showProfile = async function showProfile(influencerId,influencerProfile) {
	var nextSection = generateUUID();
	currentSection = nextSection.toString();
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
	$("#my-subs-banner").hide();
	
	$(".influencer-name").html(influencerProfile.name);
	$(".influencer-description").html(influencerProfile.description);
	$("#influencer-followers").html(influencerProfile.fans);
	
	
	$(".subscribe-btn").attr('target',influencerId);
	$(".subscribe-btn").attr('price',influencerProfile.price);
	$(".subscribe-btn").html(`Subscribe for ${influencerProfile.price}(N) per month to see all the content!`);
	$(".subscribe-btn").hide();

	$(".single-content").remove();
	$("#influencer-content").show();
	$('#loading-influencer-content').hide();

	var loaderCounter = 0;
	function showAfterTwo(){
		loaderCounter++;
		if(loaderCounter==2){
			$("#influencer-profile").show();
			if (!influencerProfile.hasAccess) {
				$(".subscribe-btn").show();
			} else {
				var content = influencerProfile.content;
				if (!content.length){
					$('#loading-influencer-content').show()
					$('#loading-influencer-content').html(`${influencerProfile.name} doesn't have any content yet!`)
				} else {
					showContentInGrid(addOwner(content,influencerId,influencerProfile.name),true,nextSection);
				}
				if (influencerId == accountId){
					// it's my profile
					var addNewContent = $(".add-content-template").clone();
					addNewContent.addClass("single-content");
					$contentGrid.prepend(addNewContent).masonry( 'prepended', addNewContent );
				}
			}
		}
	}
	$("#influencer-avatar").attr('src',influencerProfile.avatar).on('load', showAfterTwo);
	$("#influencer-banner").attr('src',influencerProfile.banner).on('load', showAfterTwo);

}

function addOwner(content, id,name){
	if (!name) name = id;
	return content.map(c=>{return {ownerId:id,ownerName:name,...c} })
}

function showContentInGrid(content,inProfile,section) {
	if (section === currentSection){
		content.sort((c1,c2)=>c1.creationDate<c2.creationDate);
		$(".single-content").remove();
		$("#influencer-content").show();
		content.forEach(c=>showSingleContent(c,inProfile));
	    $contentGrid.masonry();
	}
	
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
				// if (this.width > this.height){
					// newContent.addClass("grid-item--width2")
					
				// }
				newContent.removeClass("d-none");
				$contentGrid.masonry();
			});
		} else {
			newContent.find('img').remove();
			newContent.find('video').attr('type',contentType);
			newContent.find('video').attr('src',content.sialink).on('loadeddata', function () {
				newContent.removeClass("d-none");
				$contentGrid.masonry();
	
			})
			
			
		}
	})
	
	
	newContent.find('#ctitle').html(content.description);
	let date = new Date(content.creationDate/1000000)
	if (!inProfile){
    let small = newContent.find('.tcontent');
		small.attr('target',content.ownerId);
		small.html("Uploaded on " + date.toDateString() + " by "+content.ownerName);
		newContent.find('.remove-content-btn').remove();
		newContent.find('.visit-influencer-btn').click(async function(){
			var target = $(this).attr('target');
			var influencerProfile = await getProfileOf(target)
			showProfile(target,influencerProfile);
		});
	} else {
    newContent.find('.small').html("Uploaded on "+date.toDateString());
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
	
	$contentGrid.append(newContent).masonry( 'appended', newContent ).masonry();;
}
