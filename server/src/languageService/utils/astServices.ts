import {YAMLNode, Kind, YAMLScalar, YAMLSequence, YAMLMapping, YamlMap, YAMLAnchorReference} from  'yaml-ast-parser';

export function traverse ( node: YAMLNode, visitor:ASTVisitor){
  if(!node || !visitor) return;
  switch(node.kind){
    case Kind.SCALAR:
      let scalar = <YAMLScalar> node;
      if (visitor.visit(scalar)){
      }
      break;
    case Kind.SEQ:
      let seq = <YAMLSequence> node;
      if(visitor.visit(seq)){
        seq.items.forEach(item=>{
            traverse(item,visitor);
        })
      }
      break;
    case Kind.MAPPING:
      let mapping = <YAMLMapping> node;
      if(visitor.visit(mapping)){
        traverse(mapping.value,visitor);
      }
      break;
    case Kind.MAP:
      let map = <YamlMap> node;
      if(visitor.visit(map)){
        map.mappings.forEach(mapping=>{
          traverse(mapping,visitor);
        })
      }
      break;
    case Kind.ANCHOR_REF:
      let anchor = <YAMLAnchorReference> node;
      if(visitor.visit(anchor)){
        traverse(anchor.value,visitor);
      }
      break
  }
}

export class ASTVisitor{
  public visit(node: YAMLNode) : boolean {
    return true;
  };
  public traverseBackToLocation(node: YAMLNode): void{
  }
}

export function findNode(node:YAMLNode, offset: number): YAMLNode {
  let lastNode:YAMLNode;
  class Finder extends ASTVisitor {
      visit(node:YAMLNode):boolean {
        if(node.endPosition >= offset  && node.startPosition < offset){
          lastNode=node;
          return true;
        }
        return false;
      }
  }
  traverse(node, new Finder());
  return lastNode;
}

export function generateChildren(node){
    if(!node) return [];
    switch(node.kind){
      case Kind.SCALAR :
        return [];
      case Kind.MAPPING : 
        return node;
      case Kind.MAP :
        let yamlMappingNodeList = [];
        (<YamlMap> node).mappings.forEach(node => {
          let gen = this.generateChildren(node);
          yamlMappingNodeList.push(gen);  
        });
        return [].concat([], yamlMappingNodeList);
      case Kind.SEQ :
        let yamlSeqNodeList = [];
        (<YAMLSequence> node).items.forEach(node => {
          let gen = this.generateChildren(node);
          gen.forEach(element => {
            yamlSeqNodeList.push(element);  
          });
        });
        return [].concat([], yamlSeqNodeList);
    }
  }

export function traverseForSymbols(node: YAMLNode){
  if(!node) return;
  switch(node.kind){
    case Kind.SCALAR:
      let scalar = <YAMLScalar> node;
      return [{type: 0, value: scalar}];
    case Kind.SEQ:
      let seq = <YAMLSequence> node;
      let seqList = [];
      seq.items.forEach(item=>{
          seqList.push(traverseForSymbols(item));
      });
      return seqList.concat({kind: 9, value: seq.key});
    case Kind.MAPPING:
      let mapping = <YAMLMapping> node;
      return traverseForSymbols(mapping.value).concat({kind: 9, value: mapping.key});
    case Kind.MAP:
      let map = <YamlMap> node;
      let mapList = [];
      map.mappings.forEach(mapping=>{
        mapList.push(traverseForSymbols(mapping));
      });
      return mapList;
    case Kind.ANCHOR_REF:
      let anchor = <YAMLAnchorReference> node;
      return traverseForSymbols(anchor.value).concat({kind: 9, value: anchor.key});
  }
}