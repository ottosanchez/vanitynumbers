const fs = require('fs');
const { Trie, TrieNode } = require('@datastructures-js/trie');
const dictionary = new Trie();
const dictArr = [];
const keypad = {
  2: ["a", "b", "c"],
  3: ["d", "e", "f"],
  4: ["g", "h", "i"], 
  5: ["j", "k", "l"],
  6: ["m", "n", "o"], 
  7: ["p", "q", "r", "s"],
  8: ["t", "u", "v"], 
  9: ["w", "x", "y", "z"]
}


exports.handler = async(event) => {
  let response;
  const phoneNumber = "2236868";
  try {
    const data = fs.readFileSync('10k.txt', 'UTF-8');
    const lines = data.split(/\r?\n/);
    lines.forEach((line)=> {
      if ((line.length > 1) && (line.length < 8) ) {
          dictionary.insert(line);
          dictArr.push(line);
      }
    })
    let arr = pnToLetter(phoneNumber);
    let words = getVanity(arr);
    let scores = scoreSortWords(words);
    console.log(scores);
    response = {
      statusCode: 200,
      body: JSON.stringify(scores),
    };
    
  } catch (err) {
    console.log(err);
    response = {
      statusCode: 404, 
      body: JSON.stringify(err)
    }
    
  } finally {
    return response;
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
      const words = wordBreak(str);
      if (words.length !== 0) {
        // console.log(words);
        vanityWords = vanityWords.concat(words);
      }
      return;
    }
    arr[index].forEach((element) => {
      getVanityWords(index + 1, str + element);
    });
  };
  getVanityWords();
  if (vanityWords.length === 0) {
    throw "no vanity numbers found"
  }
  return vanityWords;
}


function wordBreak(str) {
  let wordBreakArr = []
  function getWords (str, result = '') {
    if (str === "") {
        // console.log(result.trim());
        wordBreakArr.push(result.trim());
        return;
    }
    for (var i = 1; i < str.length + 1; i++) {
      var substr = str.slice(0, i);
      if (dictionary.has(substr)) {
        getWords(str.slice(i), result + ' ' + substr);
      }
    }
  }
  getWords(str);
  return wordBreakArr;
};

function scoreSortWords (wordsArr) {
  let result = {};
  let resultSorted = {};
  let resultSize = 0;
  wordsArr.forEach((vanityWord) => {
    const words = vanityWord.split(" ");
    let score = 0
    words.forEach((word) => {
      score = score + dictArr.indexOf(word)
    })
    result[score] = vanityWord;
  });
  result = Object.fromEntries(Object.entries(result).sort()); 
  if (Object.keys(result).length < 5) {
    resultSize = Object.keys(result).length;
  } else {
    resultSize = 5;
  }
  for (let i = 0; i < resultSize; i++) {
    resultSorted[Object.keys(result)[i]] = result[Object.keys(result)[i]]
  }
  return resultSorted; 

}