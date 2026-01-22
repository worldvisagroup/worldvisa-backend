**Install the Heroku CLI**
**_ Download and install the Heroku CLI. _**

**If you haven't already, log in to your Heroku account and follow the prompts to create a new SSH public key.**

Create a _.env_ file in the root directory, copy and paste the below code:
original env file [Google drive link - Need Access](https://drive.google.com/file/d/1Mdz851NI610khWOIqL3B0ep-Ss3TOW5Y/view?usp=drive_link)

ok

```
REFRESH_TOKEN=
CLIENT_ID=
CLIENT_SECRET=
URL=
ZOHO_CRM_NEW_LAYOUT_ID=
ZOHO_LAYOUT_ID=
ZOHO_CONTACTS_LAYOUT_ID=
ZOHO_DEALS_LAYOUT_ID=
RAZORPAY_SECRET=
RAZORPAY_KEY_ID=
MONGODB_CONNECTION_STRING=
ADZUNA_JOBS_APP_ID=
ADZUNA_JOBS_APP_KEY=
ADZUNA_API_URL=
WATI_ACCESS_TOKEN=
WATI_URL=
API_KEY=
API_KEY_MCUBE=
EXCHANGE_RATE_URL=
EXCHANGE_RATE_API_KEY=
SUPABASE_DATABASE_URL=
SUPABASE_ANON_KEY=
```

```
heroku login
```

Clone the repository
Use Git to clone hidden-lowlands-36873's source code to your local machine.

```
heroku git:clone -a worldvisagroup-19a980221060
cd worldvisagroup-19a980221060
```

Deploy your changes
Make some changes to the code you just cloned and deploy them to Heroku using Git.

```
git add .
git commit -am "make it better"
git push heroku master
```
