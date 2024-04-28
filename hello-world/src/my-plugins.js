import * as Blockly from 'blockly';
import {blocks} from './blocks/text';
import {forBlock} from './generators/javascript';
import {javascriptGenerator} from 'blockly/javascript';
import {save, load} from './serialization';
import {toolbox} from './toolbox';
import './index.css';
import {FixedEdgesMetricsManager} from "@blockly/fixed-edges"
import {otherFixedEdgesMetricsManager} from "./customClass/otherFixedEdgesMetricsManager"



//ws: workspace
//fy: factory (another workspace)
//wsdiv: the container of workspace
//fydiv: the container of factory
//dc: html document



export  function dragBetweenWorkspaces(ws,fy,wsdiv,fydiv,dc){
    let wsBlockDragger,fyBlockDragger=null

    let wsAblAxis,fyAblAxis=null

    let wsDeviation,fyDeviation={x:0,y:0}

    let wsSelectedBlock,fySelectedBlock=null

    let wsDuplicateBlock,fyDuplicateBlock=null

    let currentMousePos={x:0,y:0}

    dc.addEventListener('mousemove',function(e){
        currentMousePos.x=e.clientX;
        currentMousePos.y=e.clientY;
        //console.log(currentMousePos)
    });

    //the axis of block's top left in html component 
    function get_ABL_XY(workspace,workspaceDiv,block){
        const rel_Axis=block.getRelativeToSurfaceXY()
        
        return {x:(rel_Axis.x*workspace.scale)+workspace.getMetricsManager().getAbsoluteMetrics().left+workspaceDiv.getBoundingClientRect().left+workspace.scrollX,
                y:(rel_Axis.y*workspace.scale)+workspace.getMetricsManager().getAbsoluteMetrics().top+workspaceDiv.getBoundingClientRect().top+workspace.scrollY}
    }

    //the axis in workspace coordinate
    function get_REL_XY(axis,workspace){
        const x=(axis.x-workspace.getMetricsManager().getAbsoluteMetrics().left-workspace.scrollX)/workspace.scale
        //console.log(x)
        const y=(axis.y-workspace.getMetricsManager().getAbsoluteMetrics().top-workspace.scrollY)/workspace.scale
        return {x:x,y:y}
    }
    
    function get_Duplicate_Block_REL_Axis(event,other_workspace,other_workspace_div,deviation){
        const devX=other_workspace_div.getBoundingClientRect().left+deviation.x
        const devY=deviation.y
        const axis={x:event.x-devX,y:event.y-devY}
        const relAxis=get_REL_XY(axis,other_workspace)
        return [axis,relAxis]
    }

    ws.addChangeListener(function(event){
        if(event.type===Blockly.Events.BLOCK_DRAG && event.isStart && !(fyBlockDragger)){
            wsSelectedBlock = ws.getBlockById(event.blockId)
            wsAblAxis = get_ABL_XY(ws,wsdiv,wsSelectedBlock)
            wsDeviation={x:currentMousePos.x-wsAblAxis.x,y:currentMousePos.y-wsAblAxis.y}

            const jsonBlock = Blockly.serialization.blocks.save(wsSelectedBlock)
            wsDuplicateBlock = Blockly.serialization.blocks.append(jsonBlock,fy)

            // const xmlBlock=Blockly.Xml.blockToDomWithXY(wsSelectedBlock,false)
            // console.log(wsSelectedBlock.getRelativeToSurfaceXY())
            // wsDuplicateBlock=Blockly.Xml.domToBlock(xmlBlock,fy)

            wsBlockDragger = new Blockly.BlockDragger(wsDuplicateBlock,fy)
            wsBlockDragger.disconnectBlock_(false,{x:0,y:0})
            const xy=get_Duplicate_Block_REL_Axis(currentMousePos,fy,fydiv,wsDeviation)[1]
            wsBlockDragger.startDrag({
                x:xy.x,
                y:xy.y
            },false)

        }
    });

    fy.addChangeListener(function(event){
        if(event.type===Blockly.Events.BLOCK_DRAG&&event.isStart&&!(wsBlockDragger)){
            fySelectedBlock = fy.getBlockById(event.blockId)
            fyAblAxis = get_ABL_XY(fy,fydiv,fySelectedBlock)
            fyDeviation={x:currentMousePos.x-fyAblAxis.x,y:currentMousePos.y-fyAblAxis.y}
            const jsonBlock = Blockly.serialization.blocks.save(fySelectedBlock)
            console.log(jsonBlock)
            fyDuplicateBlock=Blockly.serialization.blocks.append(jsonBlock,ws)
            fyBlockDragger=new Blockly.BlockDragger(fyDuplicateBlock,ws)
            fyBlockDragger.disconnectBlock_(false,{x:0,y:0})
            const xy=get_Duplicate_Block_REL_Axis(currentMousePos,ws,wsdiv,fyDeviation)[1]
            fyBlockDragger.startDrag({
                //require modified
                x:xy.x,
                y:xy.y
            },false)
        }
    })

    const screen=document.body




    var mousemoveHandler = function(e){
        if(wsBlockDragger){
            const relAxis=get_Duplicate_Block_REL_Axis(e,fy,fydiv,wsDeviation)[1]
            wsBlockDragger.drag(e,
            {x:relAxis.x,y:relAxis.y})
        }else if(fyBlockDragger){
            const relAxis=get_Duplicate_Block_REL_Axis(e,ws,wsdiv,fyDeviation)[1]
            fyBlockDragger.drag(e,
            {x:relAxis.x,y:relAxis.y})
        }
    }

    Blockly.utils.browserEvents.bind(screen,'mousemove',null,mousemoveHandler)

    var mouseupHandler = function(e){
        if(wsBlockDragger){
            const relAxis=get_Duplicate_Block_REL_Axis(e,fy,fydiv,wsDeviation)[1]
            const ablAxis=get_Duplicate_Block_REL_Axis(e,fy,fydiv,wsDeviation)[0]


            if(ablAxis.x>-50){
                wsBlockDragger.endDrag(e,
                {x:relAxis.x,y:relAxis.y})
                wsBlockDragger=null
                wsSelectedBlock.dispose(false)

            }else{
                wsBlockDragger=null
                wsDuplicateBlock.dispose(false)
            }
            wsSelectedBlock=null
            wsDuplicateBlock=null
            
        }else if(fyBlockDragger){
            const relAxis=get_Duplicate_Block_REL_Axis(e,ws,wsdiv,fyDeviation)[1]
            const ablAxis=get_Duplicate_Block_REL_Axis(e,ws,wsdiv,fyDeviation)[0]
            console.log(ablAxis.x)
            if(ablAxis.x>fydiv.getBoundingClientRect().left-fySelectedBlock.width*fy.scale){
                
                fyBlockDragger=null
                fyDuplicateBlock.dispose(false)
            }else{
                fyBlockDragger.endDrag(e,
                    {x:relAxis.x,y:relAxis.y})
                fyBlockDragger=null
                fySelectedBlock.dispose(false)
            }
            fyDuplicateBlock=null
            fySelectedBlock=null
            
        }
        
    }
    Blockly.utils.browserEvents.bind(screen,"mouseup",null,mouseupHandler)
}