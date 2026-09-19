#!/usr/bin/env python3
"""Tier 1: for each zero-ahead public fork, star the upstream, then delete the fork. Logs every step and writes a re-fork script.
usage: delete-forks.py tier1.json   (needs `gh auth refresh -s delete_repo`)"""
import json, subprocess, sys, datetime, pathlib
targets=json.load(open(sys.argv[1])); stamp=datetime.datetime.now().astimezone().strftime('%Y-%m-%d')
out=pathlib.Path(__file__).parent; log=open(out/f'{stamp}-fork-delete.jsonl','a')
refork=open(out/f'{stamp}-refork.sh','w'); refork.write('#!/bin/sh\n# Recreate any fork deleted on '+stamp+'. Upstreams were starred, so they are also under github.com/realdubb?tab=stars\nset -x\n')
def run(*a): p=subprocess.run(a,capture_output=True,text=True); return p.returncode,(p.stdout+p.stderr).strip()
ok=fail=0
for t in targets:
    full=f"realdubb/{t['name']}"; par=t['parent']
    rec={'ts':datetime.datetime.now().astimezone().isoformat(timespec='seconds'),'repo':full,'parent':par,'aheadBy':t['aheadBy'],'steps':[]}
    if par:
        c,o=run('gh','api','-X','PUT',f'user/starred/{par}'); rec['steps'].append({'star_parent':par,'rc':c,'out':o[:120]})
    c,o=run('gh','repo','delete',full,'--yes'); rec['steps'].append({'delete':True,'rc':c,'out':o[:200]})
    if c==0: ok+=1; refork.write(f'gh repo fork {par} --clone=false   # was {full}\n' if par else f'# {full}: parent unknown\n')
    else: fail+=1
    print(f"{'ok  ' if c==0 else 'FAIL'} {full:45} <- {par}" + ('' if c==0 else f'  {o[:100]}'))
    log.write(json.dumps(rec)+'\n'); log.flush()
refork.close(); print(f'\ndeleted {ok}, failed {fail}\nlog: {log.name}\nrefork: {refork.name}')
