import fs from 'node:fs';
import ts from 'typescript';
const source = fs.readFileSync('../reference/demo-bundle.js', 'utf8');
const ast = ts.createSourceFile('reference.js', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
function literal(n) {
  if (ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n)) return n.text;
  if (ts.isNumericLiteral(n)) return Number(n.text);
  if (n.kind === ts.SyntaxKind.NullKeyword) return null;
  if (n.kind === ts.SyntaxKind.TrueKeyword) return true;
  if (n.kind === ts.SyntaxKind.FalseKeyword) return false;
  if (ts.isPrefixUnaryExpression(n)) { const v = literal(n.operand); if (n.operator === ts.SyntaxKind.MinusToken) return -v; if (n.operator === ts.SyntaxKind.ExclamationToken) return !v; }
  if (ts.isArrayLiteralExpression(n)) return n.elements.map(literal);
  if (ts.isObjectLiteralExpression(n)) return Object.fromEntries(n.properties.map(p => { if (!ts.isPropertyAssignment(p)) throw Error('not literal'); return [p.name.text, literal(p.initializer)]; }));
  throw Error('not literal');
}
const arrays = {};
for (const statement of ast.statements) if (ts.isVariableStatement(statement)) for (const d of statement.declarationList.declarations) {
  if (!d.initializer) continue;
  try { const v = literal(d.initializer); if (Array.isArray(v) && v.length && typeof v[0] === 'object') arrays[d.name.text] = v; if (v && !Array.isArray(v) && typeof v === 'object') { for (const [key,value] of Object.entries(v)) if (Array.isArray(value) && value[0]?.dueDate) { fs.mkdirSync('data',{recursive:true}); fs.writeFileSync('data/systems.json',JSON.stringify(value,null,2)); console.log('systems:',d.name.text,key,value.length); } } } catch {}
}
console.log(Object.entries(arrays).map(([k,v])=>({variable:k,length:v.length,keys:Object.keys(v[0]),first:JSON.stringify(v[0]).slice(0,180)})));
fs.mkdirSync('data', {recursive:true});
for (const [name, variable] of Object.entries({tasks:'lre',indicators:'hi',standards:'Jte',accounts:'c0'})) {
  if (!arrays[variable]) throw Error('Missing '+variable);
  fs.writeFileSync(`data/${name}.json`,JSON.stringify(arrays[variable],null,2)+'\n');
}
fs.writeFileSync('../reference/literal-arrays.json', JSON.stringify(arrays,null,2));
