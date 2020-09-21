var currentUser = null;
var users = {
	influencerUser: {
		name: "Gatinho",
		influencer: {
      id: 'influencerUser',
      name: "Gatinho",
			profile: 'Dame toda la guita, papi.',
			avatar: 'assets/avatars/gatinho.jpg',
			banner: 'assets/avatars/bannergatinho.jpg',
			followers: 1024,
			price: 30,
			content: [
        			{image:"./assets/images/pic-12.jpg",title:'Content 1',creationDate:new Date(),id:1},
				    {image:"./assets/images/pic-1.jpg",title:'Content 2',creationDate:new Date(),id:2},
				    {image:"./assets/images/pic-2.jpg",title:'Content 3',creationDate:new Date(),id:3},
				    {image:"./assets/images/pic-3.jpg",title:'Content 4',creationDate:new Date(),id:4},
				    {image:"./assets/images/pic-4.jpg",title:'Content 5',creationDate:new Date(),id:5},
				    {image:"./assets/images/pic-5.jpg",title:'Content 6',creationDate:new Date(),id:6},
			]
		},
		subs:[],
	},
  monomarron: {
    name: "El Mono Marron",
    influencer: {
      profile: 'Asdf qwer ',
      id: 'monomarron',
      name: "El Mono Marron",
      avatar: 'assets/avatars/mono.jpg',
      banner: 'assets/avatars/bannermono.jpg',
      followers: 512,
      price: 50,
      content: [
            {image:"./assets/images/pic-13.jpg",title:'Content 1',creationDate:new Date(),id:7},
            {image:"./assets/images/pic-14.jpg",title:'Content 2',creationDate:new Date(),id:8},
            {image:"./assets/images/pic-6.jpg",title:'Content 3',creationDate:new Date(),id:9},
            {image:"./assets/images/pic-7.jpg",title:'Content 4',creationDate:new Date(),id:10},
      ]
    },
    subs:[]
  },
	normalUser: {
		name: "Wanker",
		influencer: false,
		subs: ['influencerUser']
	}
}

var contentCounter = 11;

function serverIsLoggedIn(){
  return currentUser!=null;
}

function serverGetLoggedInUser(){
  return {id:currentUser, ...users[currentUser]}
}

function serverLogin(userId){
  currentUser = userId;
  return {id:userId, ...users[currentUser]}
}

function serverGetFeatured(){
  return [users.influencerUser.influencer,users.monomarron.influencer]
}

function serverFindInfluencers(partialName){
  return Object.values(users).filter(user=>{
    return user.influencer && user.influencer.name.toLowerCase().includes(partialName.toLowerCase());
  }).map(user=> user.influencer)

}

function serverEditInfluencerProfile(name,profile,avatar,banner,price){
  if (!users[currentUser] || users[currentUser].influencer==false){
    return false;
  } 
  users[currentUser].influencer.name = name;
  users[currentUser].influencer.avatar = avatar;
  users[currentUser].influencer.banner = banner;
  users[currentUser].influencer.price = price;
  users[currentUser].influencer.profile = profile;
  return true;
}

function serverBecomeInfluencer(name,profile,avatar,banner,price){
  if (!users[currentUser]){
    users[currentUser] = {name: name, id:currentUser, subs: [], };
  } 
  users[currentUser].influencer = {
    profile: profile,
    name: name,
    id: currentUser,
    avatar: avatar,
    banner: banner,
    price: price,
    followers:0,
    content:[]
  }
}

function serverSubscribe(userId){
  if (!users[userId].influencer){
    return false;
  } 
  if (!users[currentUser]){
    users[currentUser] = {name: currentUser, subs: [userId], influencer: false};
  } else {
    users[currentUser].subs.push(userId);
  }
  users[userId].influencer.followers++;
  return true;
}

function serverAddContent(image,title){
  if (!users[currentUser] || !users[currentUser].influencer) {
    return false;
  }
  users[currentUser].influencer.content.unshift({image, title,creationDate:new Date(),id:contentCounter})
  contentCounter++;
  return true;
}

function serverRemoveContent(contentId){
  if (!(users[currentUser] && users[currentUser].influencer)) {
    return false;
  }
  users[currentUser].influencer.content = users[currentUser].influencer.content.filter(c=>c.id!=contentId);
  return true;
}

function serverGetInfluencer(userId){
  if (users[userId] && users[userId].influencer){
    return users[userId].influencer;
  }
}

function serverGetContentFrom(userId){
  if (users[userId] && users[userId].influencer){
    if (serverIsSubscribed(userId)){
      return users[userId].influencer.content.map(c=>{return {...c,owner:{id:userId}}});
    }
  }
  return [];
}

function serverIsSubscribed(userId){
  return (userId == currentUser || users[currentUser].subs.includes(userId))
}

function serverGetSubscribedContent(){
  if (!users[currentUser] || users[currentUser].subs.length==0) {
    return []
  }
  var content = [];
  users[currentUser].subs.forEach(userId => {
    content = content.concat(users[userId].influencer.content.map(c=> {return {...c,owner:{id:userId,name:users[userId].influencer.name}}}))
  });
  return content;
}