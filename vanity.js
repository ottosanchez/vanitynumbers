const fs = require('fs');
const AWS = require('aws-sdk');
const region = 'us-east-1';
const {fileName, dbTable, minWordLength, maxWordLength} = process.env;
const dynamoDbClient = createDynamoDbClient(region);
const { Trie } = require('@datastructures-js/trie');
let dictionary = new Trie();
let dictArr = [];
let response;
let keypad = {
  2: ["a", "b", "c"],
  3: ["d", "e", "f"],
  4: ["g", "h", "i"], 
  5: ["j", "k", "l"],
  6: ["m", "n", "o"], 
  7: ["p", "q", "r", "s"],
  8: ["t", "u", "v"], 
  9: ["w", "x", "y", "z"]
};

try {
  let lines = readFile(fileName);
      lines.forEach((line)=> {
        if ((line.length > minWordLength - 1) && (line.length < maxWordLength + 1) ) {
            dictionary.insert(line);
            dictArr.push(line);
        }
  });
} catch (err) {
  response = formatConnectResponse(null, err);
}

exports.handler = async (event) => {
  // testnumber reference +13142226868
  const receivedPhoneNumber = event["Details"]["Parameters"]["phoneNumber"];
  const areaCode = receivedPhoneNumber.slice(2,5);
  const phoneNumber = receivedPhoneNumber.slice(5);
  console.log(phoneNumber);
  try {
    let pnInLetters = pnToLetter(phoneNumber);
    let vanityWords = getVanity(pnInLetters);
    let scoredSortedWords = scoreSortWords(vanityWords, areaCode);
    await insertToDB(scoredSortedWords, receivedPhoneNumber);
    response = formatConnectResponse(scoredSortedWords);    
  } catch (err) {
    console.log(err);
    response = formatConnectResponse(null, err);
  } finally {
    return response;
  }
};

function readFile (fileName) {
  let data = fs.readFileSync(fileName, 'UTF-8');
  let lines = data.split(/\r?\n/);
  return lines;
}

function createDynamoDbClient(regionName) {
  AWS.config.update({region: regionName});
  return new AWS.DynamoDB();
}

function formatConnectResponse(sortedWords, err = "") {
  let result = "";
  if (sortedWords === null) {
    return {vanityWords: err};
  }
  let resultSize = Object.keys(sortedWords).length;
  if (resultSize > 3) {
    resultSize = 3;
  }
  for (let i = 0; i < resultSize; i++) {
    // console.log(Object.keys(sortedWords)[i]);
    if (i === 0) {
      result = "<prosody rate='x-slow'>" + 
        "<say-as interpret-as='characters'>" + 
        sortedWords[Object.keys(sortedWords)[i]] + 
        "</say-as>" + "</prosody>";
    } else {
      result = result + ".<break strength='x-strong'/> and. <break strength='x-strong'/>" + 
        "<prosody rate='x-slow'>" +"<say-as interpret-as='characters'>" + 
         sortedWords[Object.keys(sortedWords)[i]] + 
        "</say-as>" + "</prosody>";
    }
  }
  return { vanityWords: result.trim()} ;
}

async function insertToDB(words, phoneNumber) {
    const currentTime = new Date().toISOString();
    for (let score of Object.keys(words)) {
      let params = {
          Item: {
           "pk": {
             S: words[score]
            }, 
           "sk": {
             S: currentTime
            }, 
           "attr1": {
             S: phoneNumber
            },
           "attr2": {
             S: score
            },
            "attr3": {
             S: "vanitynumber"
            }
            
          },
        TableName: dbTable
      };
      await dynamoDbClient.putItem(params).promise();
    }
}

function pnToLetter (phoneNumber)  {
  if (phoneNumber.length !== 7) {
    throw "invalid number";
  }
  const phoneNumberArr = phoneNumber.split("");
  let pnToLetterArr = [];
  for (const number of phoneNumberArr) {
    if (keypad[number]) {
      pnToLetterArr.push(keypad[number]);
    } else {
      throw "invalid number";
    }
  }
  return pnToLetterArr;
}

function getVanity (arr) {
  let vanityWords = [];
  function getVanityWords (index = 0, str = '') {
    if (index === arr.length) {
      let words = wordBreak(str);
      if (words.length !== 0) {
        vanityWords = vanityWords.concat(words);
      }
      return;
    }
    arr[index].forEach((element) => {
      getVanityWords(index + 1, str + element);
    });
  }
  getVanityWords();
  if (vanityWords.length === 0) {
    throw "no vanity numbers found";
  }
  return vanityWords;
}

function wordBreak(str) {
  let wordBreakArr = [];
  function getWords (str, result = '') {
    if (str === "") {
        wordBreakArr.push(result.trim());
        return;
    }
    for (let i = 1; i < str.length + 1; i++) {
      let substr = str.slice(0, i);
      if (dictionary.has(substr)) {
        getWords(str.slice(i), result + ' ' + substr);
      }
    }
  }
  getWords(str);
  return wordBreakArr;
}

function scoreSortWords (wordsArr, areaCode) {
  let result = {};
  let resultSorted = {};
  let resultSize = 0;
  wordsArr.forEach((vanityWord) => {
    let words = vanityWord.split(" ");
    let score = 0;
    words.forEach((word) => {
      score = score + dictArr.indexOf(word);
    });
    result[score] = vanityWord;
  });
  result = Object.fromEntries(Object.entries(result).sort()); 
  if (Object.keys(result).length < 5) {
    resultSize = Object.keys(result).length;
  } else {
    resultSize = 5;
  }
  for (let i = 0; i < resultSize; i++) {
    resultSorted[Object.keys(result)[i]] = areaCode + "" + result[Object.keys(result)[i]];
  }
  return resultSorted; 
}