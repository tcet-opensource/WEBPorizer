import dotenv from 'dotenv'
import fs from 'fs'
import http from 'http'
import { Octokit, App  } from 'octokit'
import { createNodeMiddleware } from '@octokit/webhooks'
import convert from './convert.js'
// Load environment variables from .env file
dotenv.config()

// Set configured values
const appId = process.env.APP_ID
const privateKeyPath = process.env.PRIVATE_KEY_PATH
const privateKey = fs.readFileSync(privateKeyPath, 'utf8')
const secret = process.env.WEBHOOK_SECRET
const enterpriseHostname = process.env.ENTERPRISE_HOSTNAME
const messageForNewPRs = fs.readFileSync('./message.md', 'utf8')

// Create an authenticated Octokit client authenticated as a GitHub App
const app = new App({
  appId,
  privateKey,
  webhooks: {
    secret
  },
  ...(enterpriseHostname && {
    Octokit: Octokit.defaults({
      baseUrl: `https://${enterpriseHostname}/api/v3`
    })
  })
})

// Optional: Get & log the authenticated app's name
const { data } = await app.octokit.request('/app')

// Read more about custom logging: https://github.com/octokit/core.js#logging
app.octokit.log.debug(`Authenticated as '${data.name}'`)

// Subscribe to the "pull_request.opened" webhook event
app.webhooks.on('pull_request.opened', async ({ octokit, payload }) => {
  console.log(`Received a pull request event for #${payload.pull_request.number}`)

  const appAuthor = payload.pull_request.user.login === 'webporizer[bot]';

  if (!appAuthor) {
  try {
    await octokit.rest.issues.createComment({
      owner: payload.repository.owner.login,
      repo: payload.repository.name,
      issue_number: payload.pull_request.number,
      body: messageForNewPRs
    })
  } catch (error) {
    if (error.response) {
      console.error(`Error! Status: ${error.response.status}. Message: ${error.response.data.message}`)
    } else {
      console.error(error)
    }
  }
}
})

app.webhooks.on('pull_request.closed', async ({ octokit, payload }) => {
  console.log(`Pull request #${payload.pull_request.number} has been merged.`);
  const appAuthor = payload.pull_request.user.login === 'webporizer[bot]';

  if (!appAuthor) {
    let counter = 0;
    async function createBranchAndMakeChanges(octokit, payload, newBranchName) {
      
      try {
        const owner = payload.repository.owner.login;
        const repo = payload.repository.name;
        const baseBranchSha = payload.pull_request.base.sha;
        const baseBranch = await octokit.rest.repos.getBranch({
          owner,
          repo,
          branch: baseBranchSha
        });
        const baseTreeSha = baseBranch.data.commit.commit.tree.sha;
    
        // Create a new branch based on the base branch of the merged pull request
        await octokit.rest.git.createRef({
          owner,
          repo,
          ref: `refs/heads/${newBranchName}`,
          sha: baseBranchSha
        });
        await octokit.rest.git.updateRef({
          owner,
          repo,
          ref: `heads/${newBranchName}`,
          sha: baseBranchSha,
        });
        
        await convert();
        // Continue with any other operations on the new branch
        const commit  = await octokit.rest.git.createCommit({
          owner,
          repo,
          message: 'Update codebase', 
          tree: baseTreeSha, //
          parents: [baseBranchSha], 
        });

        const newCommitSha = commit.data.sha;

        await octokit.rest.git.updateRef({
          owner,
          repo,
          ref: `heads/${newBranchName}`,
          sha: newCommitSha, 
        });
      } catch (error) {
        console.error(`Error in createBranchAndMakeChanges: ${error.message}`);
        if (error.response) {
          console.error(`Status: ${error.response.status}`);
          console.error(`Response Data:`, error.response.data)
      }
    }
  }


function generateUniqueNumber() {
  const timestamp = new Date().getTime();
  const uniqueNumber = Math.floor(timestamp * 1000 + counter);
  counter++;
  return uniqueNumber;
}

const uniqueNumber1 = generateUniqueNumber();

  // Create a new branch and make changes
  const newBranchName = 'WEBP0rizer-edit-'+uniqueNumber1;
  const prTitle = 'Pull Request Title';
const prBody = 'Description of the pull request';
await createBranchAndMakeChanges(octokit, payload, newBranchName);
 await createPullRequest(octokit, payload, newBranchName, prTitle, prBody);

  try {
    await octokit.rest.issues.createComment({
      owner: payload.repository.owner.login,
      repo: payload.repository.name,
      issue_number: payload.pull_request.number,
      body: "Merged ty"
    })
  } catch (error) {
    if (error.response) {
      console.error(`Error! Status: ${error.response.status}. Message: ${error.response.data.message}`)
    } else {
      console.error(error)
    }
  }
}
  // 
  // Create a pull request for the changes
  // const prTitle = 'Pull Request Title';
  // const prBody = 'Description of the pull request';
  // await createPullRequest(octokit, payload, newBranchName, prTitle, prBody);
});




// Optional: Handle errors
app.webhooks.onError((error) => {
  if (error.name === 'AggregateError') {
    // Log Secret verification errors
    console.log(`Error processing request: ${error.event}`)
  } else {
    console.log(error)
  }
})

// Launch a web server to listen for GitHub webhooks
const port = process.env.PORT || 3000
const path = '/api/webhook'
const localWebhookUrl = `http://localhost:${port}${path}`

// See https://github.com/octokit/webhooks.js/#createnodemiddleware for all options
const middleware = createNodeMiddleware(app.webhooks, { path })

http.createServer(middleware).listen(port, () => {
  console.log(`Server is listening for events at: ${localWebhookUrl}`)
  console.log('Press Ctrl + C to quit.')
})



// Function to create a pull request
async function createPullRequest(octokit, payload, newBranchName, title, body) {
  try {
    const owner = payload.repository.owner.login;
    const repo = payload.repository.name;
    const base = payload.pull_request.base.ref;

    // Create the pull request
    const response = await octokit.rest.pulls.create({
      owner,
      repo,
      title,
      body,
      head: newBranchName,
      base,
    });

    console.log(`Pull request created: ${response.data.html_url}`);
  } catch (error) {
    console.error(`Error creating pull request: ${error.message}`);
  }
}
