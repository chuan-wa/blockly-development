/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from 'blockly';
import {blocks} from './blocks/text';
import {forBlock} from './generators/javascript';
import {javascriptGenerator} from 'blockly/javascript';
import {save, load} from './serialization';
import {toolbox} from './toolbox';
import './index.css';
import {FixedEdgesMetricsManager} from "@blockly/fixed-edges"
import {otherFixedEdgesMetricsManager} from "./customClass/otherFixedEdgesMetricsManager"
import { dragBetweenWorkspaces } from './my-plugins';


// Register the blocks and generator with Blockly
Blockly.common.defineBlocks(blocks);
Object.assign(javascriptGenerator.forBlock, forBlock);

// Set up UI elements and inject Blockly
// const codeDiv = document.getElementById('generatedCode').firstChild;
// const outputDiv = document.getElementById('output');
const blocklyDiv = document.getElementById('blocklyDiv');
const factoryDiv = document.getElementById('factoryDiv');


otherFixedEdgesMetricsManager.setFixedEdges({
  right:true,
})
const workspace = Blockly.inject(blocklyDiv, {toolbox,
plugins:{
  metricsManager:otherFixedEdgesMetricsManager,
}});

FixedEdgesMetricsManager.setFixedEdges({
  left:false,
})
const factory = Blockly.inject(factoryDiv,{
  plugins:{
    metricsManager:FixedEdgesMetricsManager,
  }
});

function ablXY(ws,wsdiv,bl){
  const relativeAxis=bl.getRelativeToSurfaceXY();
  //mouseToSvg Position
  const absoluteAxis={
    x:(relativeAxis.x*ws.scale)+ws.getMetricsManager().getAbsoluteMetrics().left+wsdiv.getBoundingClientRect().left+ws.scrollX,
  y:(relativeAxis.y*ws.scale)+ws.getMetricsManager().getAbsoluteMetrics().top+wsdiv.getBoundingClientRect().top+ws.scrollY}
    return absoluteAxis
};

function relXY(axis,ws){
  const x=(axis.x-ws.getMetricsManager().getAbsoluteMetrics().left-ws.scrollX)/ws.scale
  console.log(x)
  const y=(axis.y-ws.getMetricsManager().getAbsoluteMetrics().top-ws.scrollY)/ws.scale
  return {x:x,y:y}
}

let deviationX=0
let deviationY=0
let currentMousePos = { x: 0, y: 0 };

//to provide mouse axis in drag event
document.addEventListener('mousemove', function(e) {
    currentMousePos.x = e.clientX;
    currentMousePos.y = e.clientY;
});
dragBetweenWorkspaces(workspace,factory,blocklyDiv,factoryDiv,document)

// function setupDragListener(workspace,factory){
//   let wsBlockDragger = null;
//   let ftBlockDragger = null
//   let startX=0;
//   let startY=0;
//   let wsAbsoluteAxis=null;
//   let ftAbsoluteAxis=null;
//   let wsDeviation={x:0,y:0}
//   let ftDeviation={x:0,y:0}
//   let wsSelectedBlock=null
//   let ftSelectedBlock=null
//   let wsDuplicateBlock=null
//   let ftDuplicateBlock=null

//   workspace.addChangeListener(function(event){
//     if(event.type=== Blockly.Events.BLOCK_DRAG && event.isStart && !(ftBlockDragger)){
//       //find the block
//       wsSelectedBlock = workspace.getBlockById(event.blockId)
//       //console.log(selectedBlock)
//       // get mouse axis
//       const mouseAxis = currentMousePos;
//       console.log("Mouse Axis:", mouseAxis);
//       // get abs block axis
//       wsAbsoluteAxis=ablXY(workspace,blocklyDiv,wsSelectedBlock)
//       console.log(wsAbsoluteAxis)
      
//       //const relativeAxis=relXY(absoluteAxis,factory)
//       // wsDeviation = mouse axis - abs
//       wsDeviation={x:mouseAxis.x-wsAbsoluteAxis.x,y:mouseAxis.y-wsAbsoluteAxis.y}
//       console.log("wsDeviation",wsDeviation)
//       //find the block
//       //save the block
//       const jsonBlock = Blockly.serialization.blocks.save(wsSelectedBlock);
//       //console.log(jsonBlock)
//       //load the block in factory
//       wsDuplicateBlock = Blockly.serialization.blocks.append(jsonBlock,factory)
      

//       //
      
//       //console.log(wsDuplicateBlock)
//       //simulate the dragging
//       wsBlockDragger = new Blockly.BlockDragger(wsDuplicateBlock,factory)

//       //console.log(relativeAxis)
//       // startX=0
//       // startY=0
//       wsBlockDragger.startDrag({
//         x:mouseAxis.x-wsDeviation.x,
//         // y:(absoluteAxis.y/factory.scale)-factory.getMetricsManager().getAbsoluteMetrics().top-factory.scrollY,
//         y:mouseAxis.y-wsDeviation.y,
//       },false)

//     }
//   });
//   factory.addChangeListener(function(event){
//     if(event.type=== Blockly.Events.BLOCK_DRAG && event.isStart &&!(wsBlockDragger)){
//       ftSelectedBlock = factory.getBlockById(event.blockId)
//       const mouseAxis = currentMousePos;
//       //console.log("Mouse Axis:", mouseAxis);
//       ftAbsoluteAxis=ablXY(factory,factoryDiv,ftSelectedBlock)
//       //console.log(absoluteAxis)
//       ftDeviation={x:mouseAxis.x-ftAbsoluteAxis.x,y:mouseAxis.y-ftAbsoluteAxis.y}
//       console.log("ftDeviation",ftDeviation)
//       //find the block
//       //save the block
//       const jsonBlock = Blockly.serialization.blocks.save(ftSelectedBlock);
//       //console.log(jsonBlock)
//       //load the block in factory
//       ftDuplicateBlock = Blockly.serialization.blocks.append(jsonBlock,workspace)

//       ftBlockDragger = new Blockly.BlockDragger(ftDuplicateBlock,workspace)
//       // ftBlockDragger.startDrag({
//       //   x:0,
//       //   // y:(absoluteAxis.y/factory.scale)-factory.getMetricsManager().getAbsoluteMetrics().top-factory.scrollY,
//       //   y:0,
//       // },false)
//     }
//   })
//   const screen = document.body
//   const ftRect=factoryDiv.getBoundingClientRect()
//   const wsRect=blocklyDiv.getBoundingClientRect()
//   console.log(ftRect.top,ftRect.left)
//   console.log("wsRect",wsRect.left)


 


//   var mousemoveHandler = function(e){
//     //console.log('Mouse_move',e.x)
//     if(wsBlockDragger){
//       const devX=ftRect.left+wsDeviation.x+4
//       const devY=wsDeviation.y
    
//       console.log(devX,devY)
      
//       //console.log(e.x,e.y)

//       wsBlockDragger.drag(e,
//       {x:e.x-devX,y:e.y-devY})
//     }else if(ftBlockDragger){
//       const devX=wsRect.left+ftDeviation.x
//       const devY=ftDeviation.y

//       const axis={x:e.x-devX,y:e.y-devY}
//       const relAxis=relXY(axis,workspace)
//       ftBlockDragger.drag(e,
//       {x:relAxis.x,y:relAxis.y})
//       console.log("x",e.x-devX)
//     }
//   }
//   Blockly.utils.browserEvents.bind(screen,'mousemove',null,mousemoveHandler)

//   var mouseupHandler = function(e){
//     if(wsBlockDragger){
//       const devX=ftRect.left+wsDeviation.x
//       const devY=wsDeviation.y
      
//       wsBlockDragger.endDrag(e,
//         {x:e.x-devX,y:e.y-devY}
//       )
//       //wsBlockDragger.fireDragEndEvent_()
//       //wsBlockDragger.updateBlockAfterMove_()
//       wsBlockDragger=null
//       if(e.x-devX>0){
//         wsSelectedBlock.dispose(false)
//       }else{
//         wsDuplicateBlock.dispose(false)
  
//       }
//     }else if(ftBlockDragger){
//       const devX=wsRect.left+ftDeviation.x
//       const devY=ftDeviation.y
//       const axis={x:e.x-devX,y:e.y-devY}
//       const relAxis=relXY(axis,workspace)
//       ftBlockDragger.drag(e,
//       {x:relAxis.x,y:relAxis.y})
//       console.log("x",e.x-devX)

//       ftBlockDragger=null
//       if(relAxis.x-devX>0){
//         ftDuplicateBlock.dispose(false)
//       }else{
//         ftSelectedBlock.dispose(false)
//       }
//     }

    
//   }
//   Blockly.utils.browserEvents.bind(screen,'mouseup',null,mouseupHandler)
// }
// setupDragListener(workspace,factory)


// const workspace = Blockly.inject(blocklyDiv, {toolbox});
// const wsFixedEdge = new CustomFixedEdgeMetricsManager(workspace);
// wsFixedEdge.setFixedEdges({right:true})
// workspace.options.plugins={metricsManager:wsFixedEdge}



// This function resets the code and output divs, shows the
// generated code from the workspace, and evals the code.
// In a real application, you probably shouldn't use `eval`.
const bindClick=function (el, func) {
  if (typeof el === 'string') {
    el = document.getElementById(el);
  }
  el.addEventListener('click', func, true);
  function touchFunc(e) {
    // Prevent code from being executed twice on touchscreens.
    e.preventDefault();
    func(e);
  }
  el.addEventListener('touchend', touchFunc, true);
};



const runCode = function(event){
  if(event.type ==='touched'){
    event.preventDefault();
  }
  javascriptGenerator.INFINITE_LOOP_TRAP="checkTimeout();\n";
  var timeouts = 0;
  var checkTimeout = function () {
    if (timeouts++ > 1000000) {
      throw MSG['timeout'];
    }
  };
  var code = javascriptGenerator.workspaceToCode(workspace);
  javascriptGenerator.INFINITE_LOOP_TRAP = null;
  try {
    eval(code);
  } catch (e) {
    alert(MSG['badCode'].replace('%1', e));
  }
  
};



//bindClick('runButton', runCode)

// Load the initial state from storage and run the code.
load(workspace);


// Every time the workspace changes state, save the changes to storage.
workspace.addChangeListener((e) => {
  // UI events are things like scrolling, zooming, etc.
  // No need to save after one of these.
  if (e.isUiEvent) return;
  save(workspace);
});


// Whenever the workspace changes meaningfully, run the code again.
workspace.addChangeListener((e) => {
  // Don't run the code when the workspace finishes loading; we're
  // already running it once when the application starts.
  // Don't run the code during drags; we might have invalid state.
  if (e.isUiEvent || e.type == Blockly.Events.FINISHED_LOADING ||
    workspace.isDragging()) {
    return;
  }
  //runCode();
});
