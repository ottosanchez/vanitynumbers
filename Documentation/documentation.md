## Reasons for implementation
The approach I took when implementing the vanity.js function was to make it as modular as possible, as that would help me break down problems in consumable chunks and meet the application BMRs as quickly as possible. I created 8 different helper functions that are also useful when debugging code, separate concerns and provide isolation.

Creating the different helper functions also helps in writing useful unit tests.

One particular challenge I faced when creating this function was how to make the kepad word combinations (several thousands per valid phone number) look up to the English word dictionary (about 10K words) efficient, a naive approach got me O(n^2) which was too slow given the volume of data, making the application slow and ineficient. From research, I found that a Trie data structure is ideal for the dictionary word lookup, and implementing this reduced the lookup time to O(1). I also leveraged an external NPM library to make a Trie with the dictionary words (txt file).

Another interesting decision I had to make was the DynamoDB table deisgn. I designed it in a way that it would satisfy my two main access patterns, i.e. writing records from the vanity.js function and reading the last vanity number records sorted by date (descending). To accomplish this I used the main database schema (defined in vanitynumbers.json) with the following key value matching: pk: vanityWord, sk: dateTime, attr1: phoneNumber, attr2: score, attr3: "vanitynumber". The way the GSI was designed helped me query vanity words in order without much extra querying effort.

To make the queryVanityTable.js I leverage No SQL workbench and extra code to format responses back to the front end, this was the most efficient way to ensure my queries worked right away. I combined this function with an API gateway to have this endpoint available to the front end application.

To create the front end application, I leveraged AWS amplify which creates the CI/CD pipeline to bring local web app code and deploy it in the cloud in a matter of minutes, this helped me create a simple lookup function and visualization quickly.

## Shortcuts
vanity.js: In the Vanity Word Scoring mechanism, once I got the result of keypad to dictionary words match up I used O(n) to get each word scored to provide sorting. In this case, the latency was not as visible since only a few words are returned from the match up, and then compared with the 10K word dictionary to get the word index. The lowest the index found in the dictionary array, the most common the word was.

In production, I would have created a more effiecient score lookup mechanism that that would have gotten me O(1) or O(logN).

In addition, I imported a the Trie data structure, in production I would have created mine since the module I used had a limitation on word look up in that it could only get exact matches, a Trie function that would lookup partial matches would have been more efficient and therefore faster.

I also would have took more care about the efficiency of my helper functions, there's work to do make them more consice and efficient. In terms of error handling I implemented the basics, however, I acknowledge that in a production application error handling must be more robust.

## Architecture Diagrams
Vanity Numbers Phone Service
https://user-images.githubusercontent.com/47998315/116829717-f2018100-ab6a-11eb-8b10-12154a286a4c.png

Web App
https://user-images.githubusercontent.com/47998315/116829741-2f660e80-ab6b-11eb-8e09-e80ba6b251f3.png

## TO-DOs
With more time I would have created a deployment package, mainly using AWS SAM or CDK. I would have also integrated codepipeline, code build and code deploy to the process to deploy changes to the application only if unit test and integration tests are successful.
I would have created unit testing. I think this could be accomplish in a short timeframe since the code is modular allowing to create tests more easily.
