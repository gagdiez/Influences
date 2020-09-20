import { PersistentMap } from "near-sdk-as";

// MAP "fan,influencer" -> timestamp
// This allows us to know when a fan subscribed to an influencer
export const subscribed = new PersistentMap<string, u64>("s")

// MAP influencer -> ['content1', 'content2', ...]
@nearBindgen
export class SiaList {
  constructor(public links: Array<string>) {}
}

export const influencer_content = new PersistentMap<string, SiaList>("sia")
export const influencer_fans = new PersistentMap<string, SiaList>("sia")
