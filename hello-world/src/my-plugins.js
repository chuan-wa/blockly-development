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


export class WorkspaceCrossDragManager{
    constructor(ws,fy,wsdiv,fydiv,dc){
        this.ws = ws;
        this.fy = fy;
        this.wsdiv = wsdiv;
        this.fydiv = fydiv;
        this.dc = dc;
        this.isDragging=false;
        this.mousemoveHandler=null
        this.mouseupHandler=null
        
    }
    stop(){
        this.ws.removeChangeListener(wsstart)
        this.fy.removeChangeListener(fystart)
        Blockly.utils.browserEvents.unbind(screen, 'mousemove', null, this.mousemoveHandler);
        Blockly.utils.browserEvents.unbind(screen, 'mouseup', null, this.mouseupHandler);
    }
    dragBetweenWorkspaces(ws,fy,wsdiv,fydiv,dc){
        ws=this.ws
        fy=this.fy
        wsdiv=this.wsdiv
        fydiv=this.fydiv
        dc=this.dc
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
    
        function hideXmlBlock(xmlBlock){
            
            const xmlString=new XMLSerializer().serializeToString(xmlBlock)
            const xmlData=new DOMParser().parseFromString(xmlString,'application/xml')
            const block=xmlData.querySelector('block')
            if(block){
                block.setAttribute('x','-50000')
                block.setAttribute('y','-50000')
                const comment = block.querySelector('comment');
                if (comment) {
                    comment.setAttribute('pinned', 'false');
                }
            }
            return xmlData.querySelector('block')
            return new XMLSerializer().serializeToString(xmlData)
            
        }
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
        function wsstart(event){
            if(event.type===Blockly.Events.BLOCK_DRAG && event.isStart && !(fyBlockDragger)){
                wsSelectedBlock = ws.getBlockById(event.blockId)
                wsAblAxis = get_ABL_XY(ws,wsdiv,wsSelectedBlock)
                wsDeviation={x:currentMousePos.x-wsAblAxis.x,y:currentMousePos.y-wsAblAxis.y}
    
                // const jsonBlock = Blockly.serialization.blocks.save(wsSelectedBlock)
                // wsDuplicateBlock = Blockly.serialization.blocks.append(jsonBlock,fy)
    
                let xmlBlock=Blockly.Xml.blockToDomWithXY(wsSelectedBlock,false)
                const hiddenXmlBlock=hideXmlBlock(xmlBlock)
                console.log("xml:",hiddenXmlBlock)
                wsDuplicateBlock=Blockly.Xml.domToBlock(hiddenXmlBlock,fy)
                
    
                wsBlockDragger = new Blockly.BlockDragger(wsDuplicateBlock,fy)
                wsBlockDragger.disconnectBlock_(false,{x:0,y:0})
                const xy=get_Duplicate_Block_REL_Axis(currentMousePos,fy,fydiv,wsDeviation)[1]
                wsBlockDragger.startDrag({
                    x:xy.x,
                    y:xy.y
                },false)
    
            }
        }
        
        ws.addChangeListener(wsstart);
        function fystart(event){
            if(event.type===Blockly.Events.BLOCK_DRAG&&event.isStart&&!(wsBlockDragger)){
                fySelectedBlock = fy.getBlockById(event.blockId)
                fyAblAxis = get_ABL_XY(fy,fydiv,fySelectedBlock)
                fyDeviation={x:currentMousePos.x-fyAblAxis.x,y:currentMousePos.y-fyAblAxis.y}
                // const jsonBlock = Blockly.serialization.blocks.save(fySelectedBlock)
                // console.log(jsonBlock)
                // fyDuplicateBlock=Blockly.serialization.blocks.append(jsonBlock,ws)
                const xmlBlock=Blockly.Xml.blockToDomWithXY(fySelectedBlock,false)
                const hiddenXmlBlock=hideXmlBlock(xmlBlock)
                console.log("xml:",hiddenXmlBlock)
                fyDuplicateBlock=Blockly.Xml.domToBlock(hiddenXmlBlock,ws)
                
                
                fyBlockDragger=new Blockly.BlockDragger(fyDuplicateBlock,ws)
                fyBlockDragger.disconnectBlock_(false,{x:0,y:0})
                const xy=get_Duplicate_Block_REL_Axis(currentMousePos,ws,wsdiv,fyDeviation)[1]
                fyBlockDragger.startDrag({
                    //require modified
                    x:xy.x,
                    y:xy.y
                },false)
            }
        }
        fy.addChangeListener(fystart)
    
        const screen=document.body
    
    
    
    
        this.mousemoveHandler = function(e){
            if(wsBlockDragger){
                const relAxis=get_Duplicate_Block_REL_Axis(e,fy,fydiv,wsDeviation)[1]
                wsBlockDragger.drag(e,
                {x:relAxis.x,y:relAxis.y})
            }else if(fyBlockDragger){
                const relAxis=get_Duplicate_Block_REL_Axis(e,ws,wsdiv,fyDeviation)[1]
                fyBlockDragger.drag(e,
                {x:relAxis.x,y:relAxis.y})
            }else{
                return
            }
        }
    
        Blockly.utils.browserEvents.bind(screen,'mousemove',null,this.mousemoveHandler)
    
        this.mouseupHandler = function(e){
            if(wsBlockDragger){
                const relAxis=get_Duplicate_Block_REL_Axis(e,fy,fydiv,wsDeviation)[1]
                const ablAxis=get_Duplicate_Block_REL_Axis(e,fy,fydiv,wsDeviation)[0]
    
    
                if(ablAxis.x>-50){
                    wsBlockDragger.endDrag(e,
                    {x:relAxis.x,y:relAxis.y})
                    wsBlockDragger=null
                    wsSelectedBlock.dispose(false)
    
                }else{
                    wsBlockDragger.endDrag(e,
                    {x:relAxis.x,y:relAxis.y})
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
                    fyBlockDragger.endDrag(e,
                        {x:relAxis.x,y:relAxis.y})
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
                
            }else{
                return
            }
            
        }
        Blockly.utils.browserEvents.bind(screen,"mouseup",null,this.mouseupHandler)
    }
    
}


