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
import { callOpenAiAPI } from './openAIapi';


// Register the blocks and generator with Blockly
Blockly.common.defineBlocks(blocks);
Object.assign(javascriptGenerator.forBlock, forBlock);

// Set up UI elements and inject Blockly
// const codeDiv = document.getElementById('generatedCode').firstChild;
// const outputDiv = document.getElementById('output');
const blocklyDiv = document.getElementById('blocklyDiv');
const factoryDiv = document.getElementById('factoryDiv');
const assistWorkspaceDiv = document.getElementById('assist-workspace')

otherFixedEdgesMetricsManager.setFixedEdges({
  right:true,
})
const workspace = Blockly.inject(blocklyDiv, {toolbox,
plugins:{
  metricsManager:otherFixedEdgesMetricsManager,
}
});

FixedEdgesMetricsManager.setFixedEdges({
  left:false,
})
const factory = Blockly.inject(factoryDiv,{
  plugins:{
    metricsManager:FixedEdgesMetricsManager,
  }
});
const assistWorkspace=Blockly.inject(assistWorkspaceDiv)

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
function xmlAdapter(content){
  var xmlDom=Blockly.utils.xml.textToDom(content)
  try{
    Blockly.Xml.domToWorkspace(xmlDom,assistWorkspace)
  }catch(error){
    alert("AI face error to generate complete code")
  }
  xmlDom=Blockly.Xml.workspaceToDom(assistWorkspace)
  assistWorkspace.clear()
  console.log(xmlDom)
  return xmlDom
}


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



function runCode(){
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

document.getElementById('runButton').addEventListener('click',runCode)


const toolboxInfo=`This is the original Blockly toolbox:
{
"Logic": ["controls_if", "logic_compare", "logic_operation", "logic_negate", "logic_boolean", "logic_null", "logic_ternary"],
"Loops": ["controls_repeat_ext", "controls_whileUntil", "controls_for", "controls_forEach", "controls_flow_statements"],
"Math": ["math_number", "math_arithmetic", "math_single", "math_trig", "math_constant", "math_number_property", "math_round", "math_on_list", "math_modulo", "math_constrain", "math_random_int", "math_random_float", "math_atan2"],
"Text": ["text", "text_multiline", "text_join", "text_append", "text_length", "text_isEmpty", "text_indexOf", "text_charAt", "text_getSubstring", "text_changeCase", "text_trim", "text_count", "text_replace", "text_reverse", "add_text"],
"Lists": ["lists_create_with", "lists_repeat", "lists_length", "lists_isEmpty", "lists_indexOf", "lists_getIndex", "lists_setIndex", "lists_getSublist", "lists_split", "lists_sort", "lists_reverse"],
"Color": ["colour_picker", "colour_random", "colour_rgb", "colour_blend"],
"Variables": ["custom_variable"],
"Functions": ["custom_procedure"]
}
Notes: remember the starting index in blockly list is 1
remember the starting character in blockly string is 1
if there is no string found in the string, it will return 0 instead of -1.
`



async function generateCodeAI() {
  const overlay=document.createElement('div')
  overlay.className='overlay';
  const spinner = document.createElement('div')
  spinner.className='loader'
  overlay.appendChild(spinner);
  factoryDiv.appendChild(overlay)
  overlay.style.display = 'flex'
  try{
    const request=document.getElementById('exerciseInput').value
    const degree=document.getElementById('scrollLabel').innerText
    const message=[{role:'system',content:toolboxInfo+
      "This is the task: "+request+". If the task is nothing, the default task is (print HelloWorld for five times)."+
      "I want to you generate XML format Blockly code to solve the task based on the blocks in previous toolbox."+
      "You may be asked to generate partly answer, which is low granularity, only contains the core blocks might be required to solve the task, and these blocks should be seperate (not connected)."+
      "If the answer is partly, You could write concise blockly inherent comments in the very core blocks as a hint, to indicate how this core block would be used in this task."+
      "For example, like this: "+
      `  <block type="text_print" id="fu=Lz]^euh+RIu4g*;1#" x="213" y="288">
      <comment pinned="true" h="80" w="160">this is the comment
      </comment>
    </block>`+
      "Remeber to place the seperate blocks seperately to make it clear"+
      "Remeber to contain the "+
      "You may be asked to generate complete answer."+
      "You should generate "+degree+" answer."+
      "The xml format code should be pure in this format, no other texts like Here should be included"+
      `
      <xml xmlns="https://developers.google.com/blockly/xml">
      "code"
        </xml>
        `
    }]
    const response = await callOpenAiAPI(message)
    console.log(response)
    const codeBlockStart = "```xml";
    const codeBlockEnd = "```"
    if (xmlString.startsWith(codeBlockStart)) {
      xmlString = xmlString.substring(codeBlockStart.length).trim();
    }
    if (xmlString.endsWith(codeBlockEnd)) {
      xmlString = xmlString.substring(codeBlockEnd.length).trim();
    }
  
    const xmlStartTag = '<xml xmlns="https://developers.google.com/blockly/xml">';
    const xmlEndTag = '</xml>';
    
    if (!xmlString.startsWith(xmlStartTag)) {
      xmlString = `${xmlStartTag}\n${xmlString}\n${xmlEndTag}`;
    }
    console.log(xmlString)
    xmlString=xmlAdapter(xmlString)
    factory.clear()
    Blockly.Xml.domToWorkspace(xmlString,factory)
  } catch(error){
    alert("Error occured, please try again")
    console.log(error)
  } finally{
    overlay.style.display='none'
    factoryDiv.removeChild(overlay)
  }

  // Add AI code generation logic here
}

async function makeExercisesAI(){
  const request=document.getElementById('exerciseInput').value
  console.log(document.getElementById('scrollLabel').innerText)
  const messgae=[{ role: 'system', content: toolboxInfo+"I want you to generate one random Blockly coding questions for students which can be solved by the blocks only in the previous blockly toolbox"+"The difficulty can range from easy to difficult. Easy question may require one or two simple concepts to solve. More difficult questions require students comprehend in more concept or the difficult concept"
    +"These are examples and do not use them as exercise."
    +" The execrise may relevant to this information:("+request+"). You may ignore the information in brackets if it not relevant to Blockly. Generate Two parts, one is Title including the difficulty notifier, (start with ####Title and content in nextline), another one is Requirements (start wit ####Requirements and content in nextline), the requirements should better be in steps."
    +"Students cannot see the name of blocks' type like (control_if), you can generally describe them in requirements, like using if condition block, using the block that contain math and so on."
    +"Normally, blockly program do not provide the function to prompt user to enter input. Instead, you can let students to define the input."
    +"Now generate one"+document.getElementById('scrollLabel').innerText+ "exercise at random."
  }]
  console.log(messgae)
  const response = await callOpenAiAPI(messgae) 
  createExerciseWindow(response)
}

 async function optimizeCodeAI() {
  const overlay=document.createElement('div')
  overlay.className='overlay';
  const spinner = document.createElement('div')
  spinner.className='loader'
  overlay.appendChild(spinner);
  factoryDiv.appendChild(overlay)
  overlay.style.display = 'flex'
  try{
    const userXML=Blockly.Xml.workspaceToDom(factory)
    const XMLtext=Blockly.Xml.domToPrettyText(userXML)
    const request=document.getElementById('exerciseInput').value
    const message=[{ role: 'system', content: toolboxInfo+'I will give you the blockly xml code, please debug it with some comments inside it if necessary, return the pure debugged xml code and the text suggestions.'+
      +"To add comments in the block, you can follow this example: "+
      `
      <block type="text_print" id="fu=Lz]^euh+RIu4g*;1#" x="213" y="288">
      <comment pinned="true" h="80" w="160">this is the comment
      </comment>
    </block>
      `+". Only the xml code and the text suggestions. First xml code, then text suggestions."
      +"The xml code should in this format, bracket by ######"+`
      ######
        <xml xmlns="https://developers.google.com/blockly/xml">
        "code"
          </xml>
          ######
      `+"The text suggestions should in this format, bracket by %%%%%%%"+`
      %%%%%%%
      text
      %%%%%%%
      `+
      "This is the additional information on how to do the debugging: "+request+". If no additional information, just go on."+
      "The degree of debugging is "+document.getElementById('scrollLabel').innerText+
      " .Here is the original xml code: "+XMLtext }];
  
    const response = await callOpenAiAPI(message);
    const parseAIResponse = (response) => {
      const xmlPattern = /######\s*<xml xmlns="https:\/\/developers.google.com\/blockly\/xml">([\s\S]*?)<\/xml>\s*######/;
      const textPattern = /%%%%%%%\s*([\s\S]*?)\s%%%%%%%/
    
      const xmlMatch = response.match(xmlPattern);
      const textMatch = response.match(textPattern);
    
      const debuggedXml = xmlMatch ? xmlMatch[1].trim() : "No XML found in response.";
      const descriptionText = textMatch ? textMatch[1].trim() : "No description found in response.";
      const xmlStartTag = '<xml xmlns="https://developers.google.com/blockly/xml">';
      const xmlEndTag = '</xml>';
      
      if (!debuggedXml.startsWith(xmlStartTag)) {
        debuggedXml = `${xmlStartTag}\n${debuggedXml}\n${xmlEndTag}`;
      }
    
      return { debuggedXml, descriptionText };
    };
    console.log(response)
    const { debuggedXml, descriptionText } = parseAIResponse(response);
    console.log(debuggedXml)
    if(debuggedXml==="No XML found in response."){

    }else{
      const goodXml=xmlAdapter(debuggedXml)
      console.log(goodXml)
      factory.clear()
      Blockly.Xml.domToWorkspace(goodXml,factory)
      console.log(goodXml)
    }
    const container=document.getElementById('factoryDivExtraContainer')
    container.innerHTML=""
    container.innerHTML=descriptionText

  }catch(error){
    console.log(error)
    alert("AI face error in debugging, please try again")
  }finally{
    overlay.style.display='none'
    factoryDiv.removeChild(overlay)
  }
  
}

async function explainCodeAI() {
  
  const overlay=document.createElement('div')
  overlay.className='overlay';
  const spinner = document.createElement('div')
  spinner.className='loader'
  overlay.appendChild(spinner);
  factoryDiv.appendChild(overlay)
  overlay.style.display = 'flex'
  try{
    const userXML=Blockly.Xml.workspaceToDom(factory)
    const XMLtext=Blockly.Xml.domToPrettyText(userXML)
    const request=document.getElementById('exerciseInput').value
    const message=[{ role: 'system', content: toolboxInfo+'I will give you the blockly xml code, please explain it, return the text description.'+
      "This is the additional information on what requires to explain in this code: "+request+". If no additional information, just go on."+
      "The degree of explaining is to "+document.getElementById('scrollLabel').innerText+
      "you should be more friendly to novice."+
      "The output should be in structure to make it clear."+
      "However, do not make the explanation too long"+
      " .Here is the original xml code: "+XMLtext }];
  
    const response = await callOpenAiAPI(message);

    const container=document.getElementById('factoryDivExtraContainer')
    container.innerHTML=""
    container.innerHTML=response

  }catch(error){
    console.log(error)
    alert("AI face error in debugging, please try again")
  }finally{
    overlay.style.display='none'
    factoryDiv.removeChild(overlay)
  }
}

// Bind the AI interaction functions to the buttons
document.getElementById('sendButton').addEventListener('click', async function() {
  const selectedOption = document.getElementById('dropdownOptions').value;
  const sendButton=this
  try{
    sendButton.classList.add('button-loading');
    sendButton.disabled = true;
    switch (selectedOption) {
      case 'generate':
          await generateCodeAI();
          break;
      case 'debug':
          await optimizeCodeAI();
          break;
      case 'explain':
          await explainCodeAI();
          break;
      case 'makeExercises':
          await makeExercisesAI();
          break;
      default:
          console.log('No action found.');
  }
  }catch(error){
    console.log('Error:',error)
  }finally{
    console.log("finish")
    sendButton.classList.remove('button-loading');
    sendButton.disabled = false;
  }
});
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
//generate exercise content window
function createExerciseWindow(content) {
  // Create a new div for the floating window
  const titleMatch = content.match(/^#### Title\s*[\r\n]+(.+)$/m);
  const requirementsMatch = content.match(/^#### Requirements\s*[\r\n]+([\s\S]+)$/m);
  const titleText = titleMatch ? titleMatch[1] : 'Exercise Details';
  let requirementsText = requirementsMatch ? requirementsMatch[1] : 'Your exercise instructions will be shown here.';
  requirementsText = requirementsText
  .replace(/^\d+\./gm, '<li>') // Replace starting numbers with <li>
  .replace(/\n\s*-\s*/g, '<br>- ') // Replace dash lists with line breaks
  .replace(/<li>/g, '</li><li>') // Close and open <li> tags
  .trim();
if (requirementsText.includes('<li>')) {
  requirementsText = `<ol>${requirementsText}</ol>`;
  requirementsText = requirementsText.replace('<ol></li>', '<ol>').replace('</li><li></li>', '</li>');
}
  
  const exerciseWindow = document.createElement('div');
  exerciseWindow.className = 'floating-window';

  // Position the window in the bottom-right corner
  exerciseWindow.style.bottom = '30px';
  exerciseWindow.style.right = '30px';
  exerciseWindow.style.position = 'fixed';

  // Create a header for dragging
  const header = document.createElement('div');
  header.className = 'window-header';
  header.innerHTML = `<span class="close-button">&times;</span><h3>${titleText}</h3>`;

  // Create content area
  const exerciseContent = document.createElement('div');
  exerciseContent.className = 'window-content';
  exerciseContent.innerHTML = `<p>${requirementsText}</p>`;

  console.log(header)
  console.log(exerciseContent)
  // Append header and content to the window
  exerciseWindow.appendChild(header);
  exerciseWindow.appendChild(exerciseContent);

  // Append the window to the body
  document.body.appendChild(exerciseWindow);

  // Add functionality to close the window
  header.querySelector('.close-button').addEventListener('click', function() {
      document.body.removeChild(exerciseWindow);
  });

  // Make the window draggable
  dragElement(exerciseWindow);
}


function dragElement(elmnt) {
    var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    const header = elmnt.querySelector('.window-header');
    if (header) {
        header.onmousedown = dragMouseDown;
    } else {
        elmnt.onmousedown = dragMouseDown;
    }

    function dragMouseDown(e) {
        e = e || window.event;e
        e.preventDefault();
        pos3 = e.clientX;
        pos4 = e.clientY;
        document.onmouseup = closeDragElement;
        document.onmousemove = elementDrag;
    }

    function elementDrag(e) {
        e = e || window.event;
        e.preventDefault();
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
        elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
    }

    function closeDragElement() {
        document.onmouseup = null;
        document.onmousemove = null;
    }
}
document.getElementById('dropdownOptions').addEventListener('change', function() {
  const scrollButton = document.getElementById('scrollButton');
  const scrollLabel = document.getElementById('scrollLabel');
  const selectedOption = this.value;

  if (selectedOption === 'generate') {
      scrollButton.min = 1;
      scrollButton.max = 2;
      scrollButton.value = 1;
      scrollLabel.innerText = 'Partly';
  } else if (selectedOption === 'explain') {
      scrollButton.min = 1;
      scrollButton.max = 3;
      scrollButton.value = 1;
      scrollLabel.innerText = 'Explain to Novice';
  } else if (selectedOption === 'makeExercises') {
      scrollButton.min = 1;
      scrollButton.max = 4;
      scrollButton.value = 1;
      scrollLabel.innerText = 'Very Easy';
  } else if(selectedOption ==="debug"){
      scrollButton.min = 1;
      scrollButton.max = 2;
      scrollButton.value = 1;
      scrollLabel.innerText = 'Suggestions';
  }
});

document.getElementById('scrollButton').addEventListener('input', function() {
  const scrollLabel = document.getElementById('scrollLabel');
  const selectedOption = document.getElementById('dropdownOptions').value;

  if (selectedOption === 'generate') {
      scrollLabel.innerText = this.value === '1' ? 'Partly' : 'Completely';
  } else if (selectedOption === 'explain') {
      const levels = ['Explain to Novice', 'Explain to Beginner', 'Explain to Intermediate'];
      scrollLabel.innerText = levels[this.value - 1];
  } else if (selectedOption === 'makeExercises') {
      const difficulties = ['Very Easy', 'Easy', 'Medium', 'Difficult'];
      scrollLabel.innerText = difficulties[this.value - 1];
  } else if (selectedOption === 'debug'){
    const levels = ['Suggestions', 'Code Refinement'];
      scrollLabel.innerText = levels[this.value - 1];
  }




});