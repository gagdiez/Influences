new-awesome-project
==================

This app was initialized with [create-near-app]

Run with "npm run start"


Things to Decide
================

### The data-structure of the contract, idea:
   - (1) Each time you pay, save the data of payment? If it was one month ago, get out of here
   - (2) Each time you pay, we save the content that you have unlocked (problem => lots of storage needed per user)

### How to unlock content?

We cannot just have the contract saying "YES, they has access", and then showing stuff with JS... it's too easy to hack.
Maybe the contract could respond with the link to the content... in which case we need to give the contract creator the
ability to store content in the contract... don't know how to do it, but sounds possible.

If we use data structure (1) then we simply return a list with all the contents; if we use data structure (2) then we need to reply on each call.

Quick Start
===========

To run this project locally:

1. Prerequisites: Make sure you've installed [Node.js] ≥ 12
2. Install dependencies: `yarn install`
3. Run the local development server: `yarn dev` (see `package.json` for a
   full list of `scripts` you can run with `yarn`)

Now you'll have a local development environment backed by the NEAR TestNet!

Go ahead and play with the app and the code. As you make code changes, the app will automatically reload.


Exploring The Code
==================

1. The "backend" code lives in the `/assembly` folder. This code gets deployed to
   the NEAR blockchain when you run `yarn deploy:contract`. This sort of
   code-that-runs-on-a-blockchain is called a "smart contract" – [learn more
   about NEAR smart contracts][smart contract docs].
2. The frontend code lives in the `/src` folder. `/src/index.html` is a great
   place to start exploring. Note that it loads in `/src/index.js`, where you
   can learn how the frontend connects to the NEAR blockchain.
