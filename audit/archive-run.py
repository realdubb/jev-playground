#!/usr/bin/env python3
"""Archive GitHub repos chosen by github-prune.ts. Tags each with a topic first, logs every step, writes an undo script.
usage: archive-run.py targets.json
"""
import json, subprocess, sys, datetime, pathlib
targets = json.load(open(sys.argv[1]))
stamp = datetime.datetime.now().astimezone().strftime('%Y-%m-%d')
topic = f'jev-archived-{stamp[:7]}'
owner = subprocess.run(['gh','api','user','--jq','.login'],capture_output=True,text=True,check=True).stdout.strip()
out = pathlib.Path(__file__).parent
log = open(out/f'{stamp}-github-archive.jsonl','a')
undo = open(out/f'{stamp}-undo.sh','w'); undo.write(f'#!/bin/sh\n# Undo the {stamp} archive run. Reverses order, safe to rerun.\nset -x\n')
def run(*a):
    p=subprocess.run(a,capture_output=True,text=True); return p.returncode, (p.stdout+p.stderr).strip()
for t in targets:
    name=t['item']['name']; full=f'{owner}/{name}'
    before=json.loads(run('gh','api',f'repos/{full}','--jq','{archived,topics,private,fork,pushed_at}')[1] or '{}')
    rec={'ts':datetime.datetime.now().astimezone().isoformat(timespec='seconds'),'repo':full,'verdict':t['choice'],'confidence':round(t['probability'],2),
         'years_idle':t['item']['yearsSinceLastPush'],'before':before,'steps':[]}
    if before.get('archived'):
        rec['steps'].append({'skip':'already archived'}); print(f'skip  {full} (already archived)')
    else:
        c,o=run('gh','repo','edit',full,'--add-topic',topic); rec['steps'].append({'add_topic':topic,'rc':c,'out':o[:200]})
        c2,o2=run('gh','repo','archive',full,'--yes'); rec['steps'].append({'archive':True,'rc':c2,'out':o2[:200]})
        ok = c2==0
        print(f"{'ok   ' if ok else 'FAIL '} {full:45} {t['choice']:8} {t['probability']:.2f}  {t['item']['yearsSinceLastPush']}y idle" + ('' if ok else f'  {o2[:120]}'))
        if ok:
            undo.write(f'gh repo unarchive {full} --yes && gh repo edit {full} --remove-topic {topic}\n')
    log.write(json.dumps(rec)+'\n'); log.flush()
undo.close(); print(f'\nlog: {log.name}\nundo: {undo.name}')
