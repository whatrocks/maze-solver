var _ = require('lodash');
var fs = require('fs');

var mazeBuffer = fs.readFileSync('maze1.bmp');

// Create an array from the file
var getBuffer = function( fileObj ) {
  return Array.from(mazeBuffer);
};

var getImageSize = function( array ) {
  // console.log(JSON.stringify([array[21], array[20], array[19], array[18]]))
  return {
    width: parseInt(array[21].toString(16) + array[20].toString(16) + array[19].toString(16) + array[18].toString(16), 16),
    height: parseInt(array[25].toString(16) + array[24].toString(16) + array[23].toString(16) + array[22].toString(16), 16)
  }
}

// Get entry data
var getImageData = function ( array ) {
  return array.slice( array[10] );
};

// Chunk into three for RGB
var chunkRGB = function ( array ) {
  return _.chunk(array, 3);
};

// Convert RGB to true (wall), false (space)
var convertRGB = function ( array ) {
  return _.map( array, ( [ R, G, B] ) => R + G + B === 0);
};

// Create rows based on width of image
var createRows = function( array, width ) {
  return _.chunk(array, width);
}

// Get height and width of the maze image
var myMazeSize = getImageSize(mazeBuffer);

// console.log("size:", myMazeSize);

var makeMaze = _.flow(
  (obj) => getBuffer(obj),
  (bufferArray) => getImageData(bufferArray),
  (imageArray) => chunkRGB(imageArray),
  (rgbArray) => convertRGB(rgbArray),
  (trueFalseArray) => createRows(trueFalseArray, myMazeSize.width)
);

var myMaze = makeMaze(mazeBuffer);

// TODO: Maze is flipped vertically right now. Need to resolve
var printMaze = function( array ) {

  for ( var i = 0; i < array.length; i++) {
    var row = '';
    for ( var j = 0; j < array[i].length; j++) {
      if ( array[i][j] ) row += '+';
      else row += ' ';
    }
    console.log(row);
  }

};

// printMaze(myMaze);

var findEntryPoints = function(maze) {

  // Assumes entrance on the left side
  // Need to account for whitespace on the left and top though
  var entrance = [];
  var exit = [];

  // Find starting wall
  var startingRow = 0;
  var startingCol = 0;
  var endingRow = 0;
  var endingCol = 0;
  var found = false;

  for ( var i = 0; i < maze.length; i++ ) {
    for ( var j = 0; j < maze[i].length; j++ ) {
      if ( maze[i][j] ) {
        startingRow = i;
        startingCol = j;
        found = true;
        break;
      }
    }
    if ( found ) {
      break;
    }
  }

  // Find the last column
  for ( var i = startingCol; i < maze[startingRow].length; i++ ) {
    if ( !maze[startingRow][i] ) {
      endingCol = i - 1;
      endingRow = endingCol;
      break;
    }
  }

  // Find the entrance (assume perfect square right now)
  for ( var i = startingRow; i < maze.length; i++ ) {
    if ( !maze[i][startingCol] && i < endingCol ) {
      entrance.push( [i,startingCol] );
    }
  }

  // Find the exit
  for ( var i = startingRow; i < endingCol; i++ ) {
    // console.log( maze[i][endingCol]);
    if ( !maze[i][endingCol] && i < endingCol ) {
      exit.push ( [i,endingCol] );
    }
  }

  return {startingRow, startingCol, endingRow, endingCol, entrance, exit};
};

// [Row, Column]
const POTENTIAL_MOVES = {
  right: [0, 1],
  upright: [-1, 1],
  downright: [1, 1],
  upleft: [-1, -1],
  up: [-1, 0],
  down: [-1, 0],
  downleft: [-1, -1],
  left: [0, -1]
};


var entryPoints = findEntryPoints(myMaze);

var findSolution = function (maze) {

  var { startingRow, startingCol, endingRow, endingCol, entrance, exit } = entryPoints;

  console.log("exit:", exit);

  var validNextMoves = function( currentPoint ) {
    var validMoves = [];
    for ( var move in POTENTIAL_MOVES ) {
      var newRow = currentPoint[0] + POTENTIAL_MOVES[move][0];
      var newCol = currentPoint[1] + POTENTIAL_MOVES[move][1];
      if ( !myMaze[newRow][newCol] &&
           newRow > startingRow &&
           newRow < endingRow &&
           newCol > startingCol &&
           newCol < endingCol + 1 ) {
        validMoves.push([newRow, newCol]);
      }
    }
    return validMoves;
  };

  var stack = [];
  var visited = {};
  var path = [];
  stack.push( entrance[0] );

  while ( stack.length ) {

    var currentPos = stack.pop();
    // console.log("currentPos: ", currentPos);
    path.push( [currentPos] );
    visited[ JSON.stringify(currentPos) ] = true;

    // Check if reached exit
    for ( var k = 0; k < exit.length; k++ ) {
      if (exit[k][0] === currentPos[0] && exit[k][1] === currentPos[1]) {
        console.log("REACHED EXIT!");
        return path;
      }
    }

    var nextMoves = validNextMoves(currentPos);
    // If no moves left, then this path isn't working
    if ( nextMoves.length === 0 ) {
      console.log("DEAD END!");
      path.pop();
      break;
    }

    for ( var i = 0; i < nextMoves.length; i++ ) {
      if ( !( JSON.stringify(nextMoves[i]) in visited) ) {
        stack.push( nextMoves[i] );
      } else {
        continue;
      }
    }

  }
  // return undefined;
};

var mySolution = findSolution(myMaze);

var solutionSet = {};
for ( var i = 0; i < mySolution.length; i++ ) {
  solutionSet[ mySolution[i] ] = true;
}

var printMazeSolution = function( array ) {

  for ( var i = 0; i < array.length; i++) {
    var row = '';
    for ( var j = 0; j < array[i].length; j++) {
      var rowCol = i + ',' + j;
      if ( array[i][j] ) row += '+';
      else if ( rowCol in solutionSet ) row += '@'
      else row += ' ';
    }
    console.log(row);
  }

};

console.log(printMazeSolution(myMaze));
