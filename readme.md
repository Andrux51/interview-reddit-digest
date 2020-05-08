# Reddit Notifier (interview code exercise)

## Objective
It would be awesome if we (users) can receive a personalized daily email newsletter at 8 am
containing top 3 most voted posts (within the last 24 hours) from our (the user’s) favorite
sub-reddit channels.

## Task
Build a Node.js service that handles:
* Creating and updating users
* Adding, and updating a user's favorite subreddits
* Sending out an email to each user at 8am, containing the top posts of each of their
favorite subreddits
* Turning on and off the newsletter send out for a specific user

Additional Information:
* Our users use email clients that can handle html emails
* Sendgrid (https://sendgrid.com/solutions/email-api/) has a nice email api with which
you can send upto 100 emails for free.
* Our users are all techies, they love to interact directly with the service via rest API.
No UI is needed!
* We all trust each other, no auth is needed
* As an example, I, Amogh Meshram, as a user have the below 3 favorite channels.
  * News: https://www.reddit.com/r/worldnews/
  * Technology: https://www.reddit.com/r/technology/
  * Funny: https://www.reddit.com/r/funny/

## Design
See the attached design of newsletter template. We don’t care about pixel perfect design.