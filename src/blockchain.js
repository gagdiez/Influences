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
    {viewMethods: ['getProfileOf'],
     changeMethods: ['hasAccessTo', 'getContentOf', 'subscribeTo', 'getMyInfluencers',
                     'addToMyContent', 'deleteFromMyContent', 'updateMyProfile']}
  )
  return walletConnection.isSignedIn()
}

// CONTENT
export async function hasAccessTo(influencer){
  return await contract.hasAccessTo({influencer})
}

export async function subscribeTo(influencer, money_amount){
  let amount = utils.format.parseNearAmount(money_amount.toString())
  let account = window.walletConnection.account()
  account.functionCall(nearConfig.contractName, 'subscribeTo',
  					   {influencer}, 0, amount)
}

export async function getContentOf(influencer){
  return await contract.getContentOf({influencer})
}

export async function addToMyContent(sialink){
  return await contract.addToMyContent({sialink})
}

export async function deleteFromMyContent(sialink){
  return await contract.deleteFromMyContent({sialink})
}

// PROFILE name:string, public banner:string, public avatar: string,
export async function updateMyProfile(name, banner, avatar, description, price){
  price = utils.format.parseNearAmount(price)
  return await contract.updateMyProfile({name, banner, avatar,
                                         description, price})
}

export async function getProfileOf(influencer){
  let profile = await contract.getProfileOf({influencer})
  if(!profile){console.error("Profile does not exist"); return;}
  profile.price = utils.format.formatNearAmount(profile.price).toString()

  return profile
}

export async function getMyInfluencers(){
  return await contract.getMyInfluencers()
}

// SIA
function generateUUID() {
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