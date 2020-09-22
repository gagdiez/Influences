import 'regenerator-runtime/runtime'

import { initNEAR, login, logout, hasAccessTo, getContentOf, getProfileOf,
         subscribeTo, upload_file_to_sia } from './blockchain'

// Harcoded influencer for now
export const influencer_name = 'fan.testnet'

// Add events to each button on screen
document.querySelector('#sign-in-button').onclick = login
document.querySelector('#sign-out-button').onclick = logout
document.querySelector('#pay1').onclick = pay1
document.querySelector('#pay5').onclick = pay5
document.getElementById("fname").addEventListener('change', fselected, false)

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

  document.querySelectorAll('[data-behavior=influencer-id]').forEach(el => {
    el.innerText = influencer_name
  })
  
  let profile = await getProfileOf(influencer_name)
  
  if(profile){

    document.querySelectorAll('[data-behavior=influencer-id]').forEach(el => {
      el.innerText = influencer_name
    })

    document.querySelectorAll('[data-behavior=influencer-name]').forEach(el => {
        el.innerText = profile.name
    })

    document.querySelectorAll('[data-behavior=influencer-fans]').forEach(el => {
        el.innerText = profile.fans
    })

    document.querySelectorAll('[data-behavior=influencer-price]').forEach(el => {
        el.innerText = profile.price
    })

  }

  // Check if it payed or not
  show_content()
}

async function show_content(){
  let subcribed = await hasAccessTo(influencer_name)
  
  if (subcribed){
  	document.querySelector('#payed').style.display = 'block'
  	let content = await getContentOf(influencer_name)
  	
  	document.querySelectorAll('[data-behavior=influencer-content]').forEach(el => {
      el.innerText = content
    })
  }else{
    document.querySelector('#not-payed').style.display = 'block'
  }
}

// Functions for interaction

function pay1(){
    subscribeTo(influencer_name, 1)
}

function pay5(){
    subscribeTo(influencer_name, 5)
}

async function fselected(){
    let file = document.getElementById("fname").files[0]
    let skylink = await upload_file_to_sia(file)
    console.log("Done, uploaded to:" + skylink)
}

window.nearInitPromise = initNEAR()
    .then(connected => { if (connected) signedInFlow()
                         else signedOutFlow() })
