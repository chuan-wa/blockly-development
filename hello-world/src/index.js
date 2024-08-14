/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from 'blockly';
import {blocks} from './blocks/text';
import {forBlock} from './generators/javascript';
import {save, load} from './serialization';
import {toolbox} from './toolbox';
import './index.css';
import {FixedEdgesMetricsManager} from "@blockly/fixed-edges"
import {otherFixedEdgesMetricsManager} from "./customClass/otherFixedEdgesMetricsManager"
import {WorkspaceCrossDragManager } from './my-plugins';
import {javascriptGenerator} from 'blockly/javascript';
import {pythonGenerator} from 'blockly/python';
import {phpGenerator} from 'blockly/php';
import {luaGenerator} from 'blockly/lua';
import {dartGenerator} from 'blockly/dart';


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

const xmlString=`<xml xmlns="https://developers.google.com/blockly/xml">
  <variables>
    <variable id="randomStrings">randomStrings</variable>
  </variables>
  <block type="variables_set" x="10" y="10">
    <field name="VAR" id="randomStrings">randomStrings</field>
    <value name="VALUE">
      <block type="lists_create_with">
        <mutation items="5"></mutation>
        <value name="ADD0">
          <block type="text">
            <field name="TEXT">apple</field>
          </block>
        </value>
        <value name="ADD1">
          <block type="text">
            <field name="TEXT">grape</field>
          </block>
        </value>
        <value name="ADD2">
          <block type="text">
            <field name="TEXT">banana</field>
          </block>
        </value>
        <value name="ADD3">
          <block type="text">
            <field name="TEXT">cherry</field>
          </block>
        </value>
        <value name="ADD4">
          <block type="text">
            <field name="TEXT">pear</field>
          </block>
        </value>
      </block>
    </value>
    <next>
      <block type="lists_sort">
        <field name="TYPE">TEXT</field>
        <field name="DIRECTION">1</field>
        <value name="LIST">
          <block type="variables_get">
            <field name="VAR" id="randomStrings">randomStrings</field>
          </block>
        </value>
      </block>
    </next>
  </block>
</xml>
`


var xmlDom=Blockly.utils.xml.textToDom(xmlString)
//console.log(xmlDom)

try {
  Blockly.Xml.domToWorkspace(xmlDom,workspace)
} catch (error) {
  
}
xmlDom=Blockly.Xml.workspaceToDom(workspace)
workspace.clear()
Blockly.Xml.domToWorkspace(xmlDom,workspace)
console.log(xmlDom)

//Blockly.Xml.appendDomToWorkspace(xmlDom,workspace)


let currentMousePos = { x: 0, y: 0 };

//to provide mouse axis in drag event
document.addEventListener('mousemove', function(e) {
    currentMousePos.x = e.clientX;
    currentMousePos.y = e.clientY;
});
const dragManager = new WorkspaceCrossDragManager(workspace, factory, blocklyDiv, factoryDiv, document);
dragManager.dragBetweenWorkspaces()
//dragBetweenWorkspaces(workspace,factory,blocklyDiv,factoryDiv,document)
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

//text code generation
let currentLanguage='javascript'
function generateCode(){
  let code;
  switch(currentLanguage){
    case 'javascript':
      code=javascriptGenerator.workspaceToCode(workspace);
      break;
    case'python':
      code=pythonGenerator.workspaceToCode(workspace)
      break;
    case 'lua':
      code=luaGenerator.workspaceToCode(workspace)
      break;
    case 'dart':
      code=dartGenerator.workspaceToCode(workspace);
      break;
    case 'php':
      code=phpGenerator.workspaceToCode(workspace);
      break;
  }
  document.getElementById('blocklyDivExtraContainer').innerHTML = `<pre>${code}</pre>`;
}

document.querySelectorAll('.language-button').forEach(button=>{
  button.addEventListener('click',function(){
    currentLanguage = this.getAttribute('data-language');
    document.querySelectorAll('.language-button').forEach(btn => btn.classList.remove('active'));
    this.classList.add('active');
    generateCode();
  })
})
document.querySelector(`[data-language="${currentLanguage}"]`).classList.add('active');




//bindClick('runButton', runCode)

// Load the initial state from storage and run the code.
load(workspace);


// Every time the workspace changes state, generate the text code
workspace.addChangeListener(generateCode)


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
