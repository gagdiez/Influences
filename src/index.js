
import 'regenerator-runtime/runtime'


import { initNEAR, login, logout, hasAccessTo, 
		getContentOf, getProfileOf, getMyInfluencers,
         subscribeTo, upload_file_to_sia, updateMyProfile,
         addToMyContent,deleteFromMyContent } from './blockchain'

window.login = login;

window.logout = logout;

// Harcoded influencer for now
const spinner = '<i class="fas fa-sync fa-spin"></i>'; 
let $influencerGrid, $contentGrid, $searchGrid;
let avatarPlaceholder, bannerPlaceholder;

$(document).ready(function () {

    // ------------------------------------------------------
    // ADD CONTENT EVENTS
    // ------------------------------------------------------
    
    $("#upload-content-input").change(function() {
    	uploadFilePreview(this,(preview)=>{
    		$('#upload-content-preview').attr('src', preview);
		      $('#upload-content-preview').show();
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
		$('#upload-content-preview').hide();
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

    $('#dismiss, .overlay, .nav-btn').on('click', function () {
        $('#sidebar').removeClass('active');
        $('.overlay').removeClass('active');
    });

    $('#sidebarCollapse').on('click', function () {
        $('#sidebar').addClass('active');
        $('.overlay').addClass('active');
        $('.collapse.in').toggleClass('in');
        $('a[aria-expanded=true]').attr('aria-expanded', 'false');
    });

	// ------------------------------------------------------
    // INIT GRIDS 
    // ------------------------------------------------------


    $influencerGrid = initiateGrid('.featured-influencers');
    $contentGrid = initiateGrid('.content-gallery');
    $searchGrid = initiateGrid('.search-gallery');

	// ------------------------------------------------------
    // INIT LIGHTBOX GALLERY 
    // ------------------------------------------------------
    
    $(document).on('click', '[data-toggle="lightbox"]', function(event) {
        event.preventDefault();
        $(this).ekkoLightbox({
        	onContentLoaded: function() {
		         var container = $('.ekko-lightbox-container');
		         var image = container.find('img');
		         var windowHeight = $(window).height();
		         if(image.height() + 200 > windowHeight) {
		           image.css('height', windowHeight - 150);
		           var dialog = container.parents('.modal-dialog');
		           var padding = parseInt(dialog.find('.modal-body').css('padding'));
		           dialog.css('max-width', image.width() + padding * 2 + 2);
		         }
		     }
     	});
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
	window.accountProfile = await getProfileOf(accountId)

	if (accountProfile) {
    	// is influencer, main page is profile
    	showProfile();
    	$("#become-influencer-btn").hide();
    	$(".influencer-btn").show();
    } else {
    	// is not influencer, show subscription content
    	$("#become-influencer-btn").show();
    	$(".influencer-btn").hide();
		showSubscriptionContent()
    }
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
        $influencerGrid.masonry('layout');
    });
    return $grid;
}

// ------------------------------------------------------
// FILE MANAGEMENT
// ------------------------------------------------------


function uploadFilePreview(uploader,callback){
	// upload file in frontend and show preview
	if (uploader.files && uploader.files[0]) {
	    var reader = new FileReader();
	    reader.onload = function(e) {
	      callback(e.target.result)
	    }
	    reader.readAsDataURL(uploader.files[0]); // convert to base64 string
    }
}

// ------------------------------------------------------
// FIND INFLUENCERS
// ------------------------------------------------------

window.searchInfluencers = async function(){
	var name = $('#influencerSearch').val();
	$('#searching-influencer').html('Searching influencer... '+spinner)
	$('#searching-influencer').show();
	var influencerProfile = await getProfileOf(name);
	if (influencerProfile) {
		$('#searching-influencer').hide();
		showProfile(name,influencerProfile);
	} else {
		// couldn't find it 
		$('#searching-influencer').html("No influencer with that name was found.");
	}
	// setInfluencersList(influencers,'found-influencer',$searchGrid);
	// $("#search-results").show();
	// $("#featured-influencers").hide();
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

window.showSubscriptionContent = function showSubscriptionContent() {
	var subs = getMyInfluencers();
	if (!subs.length){
		return showFindInfluencers();
	}
	$("#find-influencers").hide();
	$("#influencer-profile").hide();
	$("#my-subs-banner").show();
	let content = [];
	subs.forEach(influencer=>{
		var influencerContent = getContentOf(influencer)
		content.push(influencerContent.map(post=>{return {owner:influencer, ...post}}))
	})
	content.sort((c1,c2) => c1.creationDate > c2.creationDate)
	showContentInGrid(content,false);
}

window.showFindInfluencers = function showFindInfluencers() {
	$("#influencer-profile").hide();
	$("#influencer-content").hide();
	$("#search-results").hide();
	$("#my-subs-banner").hide();
	$("#find-influencers").show();
	// TODO: show featured influencers
	// var featured = serverGetFeatured();
	// $("#featured-influencers").show();
	// setInfluencersList(featured,'featured-influencer',$influencerGrid)
	$("#featured-influencers").hide();
	$("#discover-btn").hide();
	
}

function setInfluencersList(influencers,section,$grid){
	$(`.${section}`).remove()
	influencers.forEach(f=>{
		var inf = $('.influencer-list-template').clone();
		inf.find('img').attr('src',f.avatar)
		inf.find('.influencer-link').attr('target',f.id);
		inf.find('.influencer-name').html(f.name);
		inf.removeClass('influencer-list-template');
		inf.addClass(section);
		$grid.append(inf).masonry( 'appended', inf ).masonry();
	})
	$(".influencer-link").click(async function(){
		var influencer = $(this).attr('target');
		var influencerProfile = await getProfileOf(influencer)
		showProfile(influencer,influencerProfile);
	})
}

window.showProfile = async function showProfile(influencerId,influencerProfile) {
	if (!influencerId){
		influencerId = accountId;
		influencerProfile = accountProfile;
	}
	$("#find-influencers").hide();
	$("#my-subs-banner").hide();
	
	$(".influencer-name").html(influencerProfile.name);
	$(".influencer-description").html(influencerProfile.description);
	$("#influencer-followers").html(influencerProfile.fans);

	$("#influencer-avatar").attr('src',influencerProfile.avatar);
	$("#influencer-banner").attr('src',influencerProfile.banner);
	
	$(".subscribe-btn").attr('target',influencerId);
	$(".subscribe-btn").attr('price',influencerProfile.price);
	$(".subscribe-btn").html(`Subscribe for ${influencerProfile.price}(N) per month to see all the content!`);
	$(".subscribe-btn").hide();

	$(".single-content").remove();
	$("#influencer-content").show();

	$('#loading-influencer-content').show();
	$('#loading-influencer-content').html("Loading content... "+spinner);
	$("#influencer-profile").show();
	var hasAcces = await hasAccessTo(influencerId);
	if (!hasAcces) {
		$(".subscribe-btn").show();
		$("#influencer-content").hide();
	} else {
		var content = await getContentOf(influencerId);
		if (!content.length){
			$("#influencer-content").hide();
			$('#loading-influencer-content').html(`${influencerProfile.name} doesn't have any content yet!`)
		} else {
			$('#loading-influencer-content').hide();
			showContentInGrid(addOwner(content,influencerId,influencerProfile.name),true);
		}
	}

	
}

function addOwner(content, id,name){
	return content.map(c=>{return {owner:{id,name},...c} })
}

function showContentInGrid(content,inProfile) {
	$(".single-content").remove();
	$("#influencer-content").show();
	content.forEach(c=>showSingleContent(c,inProfile));
    
}

function showSingleContent(content,inProfile) {
	var newContent = $(".content-template").clone();
	newContent.find('.main-content').attr('href',content.sialink);
	newContent.find('img').attr('src',content.sialink);
	newContent.find('h2').html(content.description);
	let date = new Date(content.creationDate/1000000)
	newContent.find('.small').html("Uploaded on "+date.toDateString());
	if (!inProfile){
		newContent.find('.visit-influencer-btn').attr('target',content.owner.id);
		newContent.find('.visit-influencer-btn').html("Visit "+content.owner.name);
		newContent.find('.remove-content-btn').remove();
		newContent.find('.visit-influencer-btn').click(async function(){
			var target = $(this).attr('target');
			var influencerProfile = await getProfileOf(target)
			showProfile(target,influencerProfile);
		});
	} else {
		newContent.find('.visit-influencer-btn').remove();
		if (content.owner.id != accountId){
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
	$contentGrid.append(newContent).masonry( 'appended', newContent ).masonry();
}