import { Context, logging, storage } from "near-sdk-as";

const DEFAULT: string = "NO"

export function hasAccess(): string | null{
  // Check if it has access, by default "no"... this should be a bool
  // but I am getting some stupid errors I cannot fix right now
  const res = storage.get<string>(Context.sender, DEFAULT)
  if (res){
    logging.log("The answer is:" + res.toString())
  }
  return res
}

export function getAccess(): void {
  // 1 NEAR == 1e24... this is a pain in the ass
  // TODO: check how to convert 1e24 to u128
  let deposit: u64 = Context.attachedDeposit.toU64()
  const res = storage.get<string>(Context.sender, "NO")

  if (deposit > 100){
    storage.set(Context.sender, "YES");
  }else{
    logging.log("You didn't pay")
  }
}
