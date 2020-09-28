import {context, env, u128, ContractPromiseBatch, logging} from "near-sdk-as";
import {subscribed, influencers_content, influencers_profile,
        influencers_of_fan, influencer_nbr_fans, Profile, ContentList,
        Content, InfluencerList, promoted_vector} from "./model"

function hasAccessTo(influencer:string): bool{
  if (context.sender == influencer){return true}

  let key:string = influencer + "@" + context.sender
  
  if (!subscribed.contains(key)){return false}
  
  // You are in the list... but lets check if one month has passed
  let when:u64 = subscribed.getSome(key)
  let now:u64 = env.block_timestamp()
  let one_month:u64 = 2592000000000000 //one_minute:u64 = 60000000000

  if (now - when < one_month){return true}

  return false
}

export function subscribeTo(influencer: string): void {
  let profile = influencers_profile.get(influencer)
 
  if(!profile){// Not an influencer
    ContractPromiseBatch.create(context.sender).transfer(context.attachedDeposit)
    return
  }

  let key = influencer + "@" + context.sender // Key for dict
  let time: u64 = env.block_timestamp()

  if (context.attachedDeposit >= profile.price){
    subscribed.set(key, time) // record the time at which you paid
    ContractPromiseBatch.create(influencer).transfer(profile.price) // pay influencer  
    addFan_addInfluencer(influencer) // fans++, and add influencer to your list
  }else{
    ContractPromiseBatch.create(context.sender).transfer(context.attachedDeposit)
  }
}

// CONTENT HANDLING

function getContentOf(influencer:string):Array<Content>{
  // Called by fans/influencers to get the influencer's content
  if (!hasAccessTo(influencer)){return new Array<Content>()}

  let links = influencers_content.get(influencer)
  if (!links){return new Array<Content>()}
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
  
  let profile = influencers_profile.get(influencer)

  if(!profile){return null}
  
  profile.hasAccess = hasAccessTo(influencer)

  let content = getContentOf(influencer)
  profile.content = content

  let fans = influencer_nbr_fans.getSome(influencer)
  profile.fans = fans

  return profile
}

export function updateMyProfile(name:string, banner:string, avatar:string,
                                description: string, price:u128):bool{
  let new_profile = new Profile(context.sender, name, banner, avatar,
                                description, price, [], 0, false)

  //Copy number of fans if the profiled existed already
  let my_profile = influencers_profile.get(context.sender)
  if (!my_profile){influencer_nbr_fans.set(context.sender, 0)}

  influencers_profile.set(context.sender, new_profile)

  return true
}

// Influencers/fans interaction handling
export function getMyInfluencers():Array<Profile>{
  
  let links = influencers_of_fan.get(context.sender)
  if (!links){
      return new Array<Profile>()
  }
  
  let profiles = new Array<Profile>();
  for (let i = 0; i < links.influencers.length; i++) {
    let aprofile = getProfileOf(links.influencers[i])
    if(aprofile){profiles.push(aprofile)}
  }
  return profiles
}

function addFan_addInfluencer(influencer:string):void{
  let influencers = influencers_of_fan.get(context.sender)
  let my_influencers: Array<string>
  
  if (!influencers){my_influencers = new Array<string>()}
  else{my_influencers=influencers.influencers}

  for (let i = 0; i < my_influencers.length; i++) {
    // If we have already subscribed at some point, return
    if (influencer == my_influencers[i]) return;
  }

  // Add influencer to my influencers
  my_influencers.push(influencer)
  let new_list = new InfluencerList(my_influencers)
  influencers_of_fan.set(context.sender, new_list)
  
  // Add me as fan of influencer
  let fans = influencer_nbr_fans.getSome(influencer)
  influencer_nbr_fans.set(influencer, fans+1)
}


// PROMOTED HANDLING

export function getPromoted():Array<Profile>{
  let promoted:Array<Profile> = new Array<Profile>()

  for (let i=0; i < promoted_vector.length; i++){
    promoted.push(promoted_vector[i])
  }

  return promoted
}

export function promoteMe():void{
  let price:u128 = u128.from('10000000000000000000000000')

  if (context.attachedDeposit >= price){
    let profile = getProfileOf(context.sender)
    if (!profile){
      ContractPromiseBatch.create(context.sender).transfer(context.attachedDeposit)
      return
    }
    promoted_vector.push(profile)
    logging.log("Promoted")
  }else{
    ContractPromiseBatch.create(context.sender).transfer(context.attachedDeposit)
  }
}
