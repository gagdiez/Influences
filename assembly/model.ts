import { PersistentMap, u128 } from "near-sdk-as";

// MAP "fan,influencer" -> timestamp, so we can cut them after one month
export const subscribed = new PersistentMap<string, u64>("s")

// MAP influencer -> [{link, upload_time}]
@nearBindgen
export class Content {
  constructor(public sialink: string, public timestamp:u64){}
}

@nearBindgen
export class ContentList {
  constructor(public content: Array<Content>) {}
}

export const influencer_content = new PersistentMap<string, ContentList>("c")

// MAP: influencer -> [{header, profile_picture, price}]
@nearBindgen
export class Profile {
  constructor(public header:string, public picture: string, public price:u128){}
}

export const influencer_profile = new PersistentMap<string, Profile>("p")
