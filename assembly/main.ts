import { context, logging, storage, env, u128,  ContractPromiseBatch} from "near-sdk-as";
import {subscribed, influencer_content, influencer_profile, Profile,
        ContentList, Content} from "./model"

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

  if (now - when < one_month){ return true }

  return false
}

export function goSubscribeTo(influencer: string): void {
  let profile = getProfileOf(influencer)
 
  if(!profile){return} // Not an influencer

  let key = influencer + "@" + context.sender // Key for dict
  let time: u64 = env.block_timestamp()

  if (context.attachedDeposit >= profile.price){
    subscribed.set(key, time) // record the time at which you paid

    ContractPromiseBatch.create(influencer).transfer(profile.price) // pay influencer 
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
  let links = influencer_content.get(influencer)
  if (!links){
      return new Array<Content>()
  }
  return links.content
}

export function addToMyContent(sialink:string):bool{
  // The influencer (context.sender) wanst to add content (a sialink)
  let links = getContentOf(context.sender)
  let time: u64 = env.block_timestamp()
  let new_content = new Content(sialink, time)

  links.push(new_content)
  let new_links = new ContentList(links)
  influencer_content.set(context.sender, new_links)
  return true
}

export function deleteFromMyContent(sialink:string):bool{
  // The influencer (context.sender) wants to delete content (a sialink)
  const links = getContentOf(context.sender)

  for (let i = 0; i < links.length; i++) {
    if (sialink == links[i].sialink) links.splice(i, 1);
  }

  let new_links = new ContentList(links)
  influencer_content.set(context.sender, new_links)
  return true
}

// PROFILE HANDLING

export function getProfileOf(influencer:string): Profile | null{
  return influencer_profile.get(influencer)
}

export function setMyProfile(header:string,  picture:string, price:u128):bool{
  let new_profile = new Profile(header, picture, price)
  influencer_profile.set(context.sender, new_profile)
  return true
}
