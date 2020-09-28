import { connect, utils, Contract, keyStores, WalletConnection } from 'near-api-js'
import getConfig from './config'

const nearConfig = getConfig('development')

// ===== API =====

export function login() {
  window.walletConnection.requestSignIn(nearConfig.contractName)
}

export function logout() {
  window.walletConnection.signOut()
  // reload page
  window.location.replace(window.location.origin + window.location.pathname)
}

export async function initNEAR() {
  // Initialize connection to the NEAR testnet - CALL IT ON LOAD
  const near = await connect(
    Object.assign({deps:{keyStore: new keyStores.BrowserLocalStorageKeyStore()}},
                  nearConfig)
  )

  // Initializing Wallet based Account
  window.walletConnection = new WalletConnection(near)

  // Getting the Account ID
  window.accountId = window.walletConnection.getAccountId()

  // Initializing contract APIs
  window.contract = new Contract(
    window.walletConnection.account(),
    nearConfig.contractName,
    {viewMethods: ['getPromoted'],
     changeMethods: ['subscribeTo', 'getMyInfluencers', 'addToMyContent',
                     'deleteFromMyContent', 'updateMyProfile', 'getProfileOf',
                     'promoteMe']}
  )
  return walletConnection.isSignedIn()
}

export async function getPromoted(){
  // Returns array of Profiles
  return await contract.getPromoted()
}

export async function promoteMe(money_amount){
  let amount = utils.format.parseNearAmount(money_amount.toString())
  console.log(amount)
  let account = window.walletConnection.account()
  account.functionCall(nearConfig.contractName, 'promoteMe', {}, 0, amount)
}

// CONTENT
export async function hasAccessTo(influencer){
  // Returns true if the user is subscribed to the influencer
  return await contract.hasAccessTo({influencer})
}

export async function subscribeTo(influencer, money_amount){
  // OPENS another webpage to pay
  let amount = utils.format.parseNearAmount(money_amount.toString())
  let account = window.walletConnection.account()
  account.functionCall(nearConfig.contractName, 'subscribeTo',
               {influencer}, 0, amount)
}

export async function getContentOf(influencer){
  // Returns a list of {sialink:str, creationDate:int, description:str)}
  return await contract.getContentOf({influencer})
}

export async function addToMyContent(sialink,description){
  // Returns true if everything goes right  
  return await contract.addToMyContent({sialink,description})
}

export async function deleteFromMyContent(sialink){
  // Returns true if everything goes right  
  return await contract.deleteFromMyContent({sialink})
}

// PROFILE
export async function updateMyProfile(name, banner, avatar, description, price){
  // Returns true if everything goes right
  price = utils.format.parseNearAmount(price? price : "0");
  return await contract.updateMyProfile({name, banner, avatar,
                                         description, price})
}

export async function getProfileOf(influencer){
  // Returns NULL or {name:str, banner:str, avatar:str, description:str, price:str, fans:int}
  let profile = await contract.getProfileOf({influencer})
  if(!profile){console.error("Profile does not exist"); return;}
  profile.price = utils.format.formatNearAmount(profile.price).toString()

  return profile
}

export async function getMyInfluencers(){
  // Returns a list of strings (representing each influencer-id)
  return await contract.getMyInfluencers()
}

// SIA
export function generateUUID() {
  let uuid = ''
  const cs = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  for (let i = 0; i < 16; i++) {
    uuid += cs.charAt(Math.floor(Math.random() * cs.length))
  }
  return uuid;
}

export async function upload_file_to_sia(file){
  const uuid = generateUUID()

  var formData = new FormData()
  formData.append("file", file)

  let response = await fetch('https://siasky.net/skynet/skyfile/'+uuid,
                             {method:"POST", body:formData})
                .then(response => response.json())
                .then(success => {return success.skylink})
                .catch(error => {console.log(error)})
  return response
}
