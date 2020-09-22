import { PersistentMap, u128 } from "near-sdk-as";

// MAP "fan,influencer" -> timestamp, so we can cut them after one month
export const subscribed = new PersistentMap<string, u64>("s")

// MAP influencer -> [{link, upload_time, description}]
@nearBindgen
export class Content {
  constructor(public sialink: string, public creationDate:u64, 
              public description:string){}
}

@nearBindgen
export class ContentList {
  constructor(public content: Array<Content>) {}
}

export const influencers_content = new PersistentMap<string, ContentList>("c")

// MAP: influencer -> Profile
@nearBindgen
export class Profile {
  constructor(public name:string, public banner:string, public avatar: string,
              public description:string, public price:u128, public fans:u16=0){}
}

export const influencers_profile = new PersistentMap<string, Profile>("p")

// MAP: influencer

@nearBindgen
export class InfluencerList {
  constructor(public influencers: Array<string>) {}
}
export const influencers_of_fan = new PersistentMap<string, InfluencerList>("i")