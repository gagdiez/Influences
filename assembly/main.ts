import {context, env, u128,  ContractPromiseBatch} from "near-sdk-as";
import {subscribed, influencers_content, influencers_profile, influencers_of_fan,
        Profile, ContentList, Content, InfluencerList} from "./model"

export function hasAccessTo(influencer:string): bool{
  if (context.sender == influencer){
    return true // You have access to your content
  }

  let key:string = influencer + "@" + context.sender
  
  if (!subscribed.contains(key)){
    return false // You are not subscribed
  }
  
  // You are in the list... but lets check if one month has passed
  let when:u64 = subscribed.getSome(key)
  let now:u64 = env.block_timestamp()
  let one_month: u64 = 2592000000000000
  let one_minute: u64 = 60000000000

  if (now - when < one_minute){ return true }

  return false
}

export function subscribeTo(influencer: string): void {
  let profile = getProfileOf(influencer)
 
  if(!profile){
    // Not an influencer
    ContractPromiseBatch.create(context.sender).transfer(context.attachedDeposit)
    return
  }

  let key = influencer + "@" + context.sender // Key for dict
  let time: u64 = env.block_timestamp()

  if (context.attachedDeposit >= profile.price){
    subscribed.set(key, time) // record the time at which you paid

    ContractPromiseBatch.create(influencer).transfer(profile.price) // pay influencer
    
    // Add 1 to the amount of fans of influencer
    // Add influencer to your list of influencers
    addInfluencerToMe_MeToInfluencersFan(influencer)
  }

  if (context.attachedDeposit < profile.price){ 
    // You didn't pay enough, we return the money
    ContractPromiseBatch.create(context.sender)
    .transfer(context.attachedDeposit) 
  }
}

// CONTENT HANDLING

export function getContentOf(influencer:string):Array<Content>{
  // Called by fans/influencers to get the influencer's content
  if (!hasAccessTo(influencer)){ return new Array<Content>()}
  let links = influencers_content.get(influencer)
  if (!links){
      return new Array<Content>()
  }
  return links.content
}

export function addToMyContent(sialink:string, description:string):bool{
  // The influencer (context.sender) wanst to add content (a sialink)
  let links = getContentOf(context.sender)
  let time: u64 = env.block_timestamp()
  let new_content = new Content(sialink, time, description)

  links.push(new_content)
  let new_links = new ContentList(links)
  influencers_content.set(context.sender, new_links)
  return true
}

export function deleteFromMyContent(sialink:string):bool{
  // The influencer (context.sender) wants to delete content (a sialink)
  const links = getContentOf(context.sender)

  for (let i = 0; i < links.length; i++) {
    if (sialink == links[i].sialink) links.splice(i, 1);
  }

  let new_links = new ContentList(links)
  influencers_content.set(context.sender, new_links)
  return true
}

// PROFILE HANDLING

export function getProfileOf(influencer:string): Profile | null{
  return influencers_profile.get(influencer)
}

export function updateMyProfile(name:string, banner:string, avatar:string,
                                description: string, price:u128):bool{
  let new_profile = new Profile(name, banner, avatar, description, price)

  //Copy number of fans if the profiled existed already
  let my_profile = getProfileOf(context.sender)
  if (my_profile){new_profile.fans = my_profile.fans} 

  influencers_profile.set(context.sender, new_profile)

  return true
}

// Influencers/fans interaction handling
export function getMyInfluencers():Array<string>{
  
  let links = influencers_of_fan.get(context.sender)
  if (!links){
      return new Array<string>()
  }
  return links.influencers
}

function addInfluencerToMe_MeToInfluencersFan(influencer:string):void{

  let profile = getProfileOf(influencer)
  if (!profile){return}

  let my_influencers = getMyInfluencers()

  for (let i = 0; i < my_influencers.length; i++) {
    // If we have already subscribed at some point, return
    if (influencer == my_influencers[i]) return;
  }

  // Add influencer to my influencers
  my_influencers.push(influencer)
  let new_list = new InfluencerList(my_influencers)
  influencers_of_fan.set(context.sender, new_list)
  
  // Add me as fan of influencer
  let new_profile = new Profile(profile.name, profile.banner,
                                profile.avatar, profile.description,
                                profile.price, profile.fans + 1)
  influencers_profile.set(influencer, new_profile)
}