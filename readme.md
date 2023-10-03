hi , so this BOT will automatically convert all the jpg and png images in your repo to webp and will optimize it automatically , 
and will even edit all the code base code to work with it thankyou .


how to contribute :
this bot currently creates a branch , and will make a pr from that newly created branch to the branch which just got merged ,
but it is unable to create commits as of now 


How to Start this Bot in your Local device :


step 1 : `npm install`

step 2 : In your browser, navigate to https://smee.io/.
Click Start a new channel.
Copy the full URL under "Webhook Proxy URL". You will use this URL in a later step

step 3 : get values of env variables by setting ur own github app in developer settings 

step 4 : set up .env files: APP_ID="YOUR_APP_ID"
WEBHOOK_SECRET="YOUR_WEBHOOK_SECRET"
PRIVATE_KEY_PATH="YOUR_PRIVATE_KEY_PATH"

step 5 : run server 
         ` npx smee -u WEBHOOK_PROXY_URL -t http://localhost:3000/api/webhook. Replace WEBHOOK_PROXY_URL`


test your app and make a branch for the issue 

docs : https://docs.github.com/en/apps/creating-github-apps/writing-code-for-a-github-app/quickstart

