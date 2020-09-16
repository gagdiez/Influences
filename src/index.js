import 'regenerator-runtime/runtime'

import { initContract, login, logout, pay50, pay200 } from './utils'

import getConfig from './config'
const { networkId } = getConfig(process.env.NODE_ENV || 'development')


document.querySelector('#sign-in-button').onclick = login
document.querySelector('#sign-out-button').onclick = logout
document.querySelector('#pay50').onclick = pay50
document.querySelector('#pay200').onclick = pay200

// Display the signed-out-flow container
function signedOutFlow() {
  document.querySelector('#signed-out-flow').style.display = 'block'
}

// Displaying the signed in flow container and fill in account-specific data
async function signedInFlow() {
  document.querySelector('#signed-in-flow').style.display = 'block'

  document.querySelectorAll('[data-behavior=account-id]').forEach(el => {
    el.innerText = window.accountId
  })

  // Check if it payed or not
  show_content()
}

async function show_content(){
  let payed = await contract.hasAccess()
  
  if (payed == "YES") document.querySelector('#payed').style.display = 'block'
  else document.querySelector('#not-payed').style.display = 'block'
}

// `nearInitPromise` gets called on page load
window.nearInitPromise = initContract()
  .then(() => {
    if (window.walletConnection.isSignedIn()) signedInFlow()
    else signedOutFlow()
  })
  .catch(console.error)
