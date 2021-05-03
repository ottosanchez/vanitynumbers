## Vanitynumbers App Description
This application provides vanity number options for your phone number, you need to dial a phone number (available to application users upon request) to hear them. If numbers are found, up to 3 will be spelled out to you, sorted from most to the least common english words by an automated menu and also available in a webpage for your reference (https://master.d1w8okf54d17xb.amplifyapp.com/). Only the last 5 users (identified by phone number) will be shown in the webpage with up to 5 vanity options each. 
    
The application takes the last 7 digits of your phone number, converts those digits to letters and matches up the different letter iterations to common English words between 3 and 7 characters long.
    
For example, if you dialed the app number from +1(314)222-6868, the system greets you, reads out your own phone number and  spells out "314ACCOUNT" to you as the only vanity number option. If you dialed from either a number whose digits do not map to a letter in the phone number pad (e.g. 0 and 1) or from a non-US based number, the system will tell you that you dialed from an invalid number. Finally, if your phone number is valid, but the there no vanity number options were found, you will hear that "no vanity numbers available". 

## Service Architecture ##
Phone Vanity Number Lookup Service: 
    
The phone service hosting voice conversations is Amazon Connect, integrated with AWS Lambda. The Lambda function (vanity) provides the vanity number lookup logic, returns sorted vanity numbers to Amazon Connect and inserts them to AWS DynamoDB to store recent vanity number results. 
    
Web App: 
    
The web app CI/CD pipeline was built using AWS Amplify. The front application (code can be found here https://github.com/ottosanchez/vanityfrontend/tree/master) calls a method in AWS API Gateway that is integrated to a Lambda function (queryVanityTable) that in turns reads vanity number lookups for the last 5 phone numbers that called in the Phone Vanity Number Lookup service. 
  

## Implementation Details- Files inclued in repo ##
There are two main Lambda functions in this repo used for the phone lookup service and Web App backend respectively.
    
vanity.js: 
The function gets the calling number from Amazon Connect, returns up to 3 sorted words in SSML format to it and writes up to 5 vanity words to DynamoDB for later lookup.

The dictionary used for word lookup is (imported as a text file to Lambda): https://github.com/first20hours/google-10000-english/blob/master/google-10000-english-usa-no-swears.txt. The words the dictionary was matched up against are all the keypad letter combinations for the dialing phone numbe (last 7 digits), usually a few thousands per valid phone number. For efficiency, a Trie data structure was used to match up keypad combinations with the dictionary since it offers constant time i.e. O(1) lookups. 

To sort the resulting vanity numbers, a scoring mechanism was used based on the previously mentioned dictionary, since its words are sorted by most common in English, a low score means a more common word or combination of words for you vanity number, up to 3 lowest scored vanity numbers were returned to Amazon Connect, while up to 5 were inserted into a DynamoDB table.
    
queryVanityTable.js: 
    
The function is called by API gateway- Get resource, queries the DynamoDB table where vanity.js wrote previous vanity numbers and related information and returns the 5 most recent callers with their respective vanity words and a timestamp.  

vanitynumbers.json:
DynamoDB schema used to create the table where vanity numbers are stored.

vanityNumber-Callflow.json:
Callflow file used in Amazon Connect for the vanity number phone service.

10k.txt:
Dictionary of common English words, sorted from most to least common.

## Deployment Instructions ##
//TO-DO

