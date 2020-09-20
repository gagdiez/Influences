import { context, logging, storage, env, u128,  ContractPromiseBatch} from "near-sdk-as";
import {subscribed, influencer_content, SiaList} from "./model"

export function hasAccess(influencer:string): bool{
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

export function subscribeTo(influencer: string): void {
  let key = influencer + "@" + context.sender // Key for dict
  let price: u128 = new u128(100)             // How much the influencer wants
  let time: u64 = env.block_timestamp()

  if (context.attachedDeposit >= price){
    subscribed.set(key, time) // record the time at which you paid

    ContractPromiseBatch.create(influencer).transfer(price) // pay influencer 
  }

  if (context.attachedDeposit < price){ 
    // You didn't pay enough, we return the money
    ContractPromiseBatch.create(context.sender).transfer(context.attachedDeposit) 
  }
}

// CONTENT HANDLING

export function getContent(influencer:string):Array<string>{
  // Called by fans/influencers to get the influencer's content
  if (!hasAccess(influencer)){ return new Array<string>()}
  let links = influencer_content.get(influencer)
  if (!links){
      return new Array<string>()
  }
  return links.links
}

export function addContent(sialink:string):void{
  // The influencer (context.sender) wanst to add content (a sialink)
  let links = getContent(context.sender)
  links.push(sialink)
  let new_links = new SiaList(links)
  influencer_content.set(context.sender, new_links)
}

export function delContent(sialink:string):void{
  // The influencer (context.sender) wants to delete content (a sialink)
  const links = getContent(context.sender)

  for (let i = 0; i < links.length; i++) {
    if (sialink == links[i]) links.splice(i, 1);
  }

  let new_links = new SiaList(links)
  influencer_content.set(context.sender, new_links)
}
