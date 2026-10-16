#!/usr/bin/env python3
"""Offline checks for the WEAVE spec pack. Requires PyYAML and jsonschema."""
from __future__ import annotations
from pathlib import Path
import json
import sys
import yaml
from jsonschema import Draft202012Validator, FormatChecker

ROOT=Path(__file__).resolve().parents[1]
PAIRS={
 'task-packet':'task-packet',
 'task-report':'task-report',
 'handoff':'handoff',
 'memory-candidate':'memory-item',
 'review-verdict':'review-verdict',
 'event':'event',
}

def check():
 errors=[]
 for n,sch in PAIRS.items():
  schema=json.loads((ROOT/'contracts/schemas'/f'{sch}.schema.json').read_text())
  obj=json.loads((ROOT/'examples'/f'{n}.json').read_text())
  Draft202012Validator.check_schema(schema)
  errs=list(Draft202012Validator(schema,format_checker=FormatChecker()).iter_errors(obj))
  errors += [f'{n}: {e.message} at {list(e.path)}' for e in errs]
 wf=yaml.safe_load((ROOT/'workflow/mastermind.yaml').read_text())
 phases=wf['phases']; phase_ids=[str(p['id']) for p in phases]
 if phase_ids!=['0','1','2','3','4','5','6','7','7.5','8','9']:
  errors.append(f'Unexpected Mastermind phase ordering: {phase_ids}')
 p75=next(p for p in phases if str(p['id'])=='7.5')
 if p75.get('approval_required') or not p75.get('when'):
  errors.append('Conditional 7.5 must be gated by stack, not human approval')
 tasks=yaml.safe_load((ROOT/'workflow/tasks.yaml').read_text())['tasks']
 ids=[t['id'] for t in tasks]
 if len(ids)!=len(set(ids)):
  errors.append('Duplicate task IDs')
 for t in tasks:
  if not t['write_paths'] or not t['exclusive_resources']:
   errors.append(f"Task {t['id']} lacks scope/resources")
  for d in t['depends_on']:
   if d not in ids:
    errors.append(f"Task {t['id']} missing dep {d}")
 depmap={t['id']:t['depends_on'] for t in tasks}; visiting=set(); visited=set()
 def visit(x):
  if x in visiting:
   errors.append(f'Dependency cycle involving {x}'); return
  if x in visited: return
  visiting.add(x)
  for d in depmap[x]: visit(d)
  visiting.remove(x); visited.add(x)
 for tid in ids:visit(tid)
 required=[
  'AGENTS.md','START_HERE.md','docs/PRD.md','docs/ARCHITECTURE.md',
  'docs/IMPLEMENTATION_PLAN.md','docs/MEMORY_ENGINE.md','docs/DATA_MODEL.md',
  'docs/PROTOCOLS.md','docs/PROVIDER_RUNTIME.md','docs/GIT_SECURITY.md',
  'docs/API_RECORD.md','docs/TEST_PLAN.md','docs/MASTERmind_INTEGRATION.md',
 ]
 for name in required:
  if not (ROOT/name).is_file():errors.append(f'Missing {name}')
 print('Checked',len(PAIRS),'example/schema pairs,',len(tasks),'tasks,',len(phases),'workflow phases, required docs')
 if errors:
  print('\n'.join('ERROR: '+e for e in errors));return 1
 print('PASS: package structure, JSON schemas/example fixtures, workflow, DAG dependencies')
 return 0

if __name__=='__main__':sys.exit(check())
