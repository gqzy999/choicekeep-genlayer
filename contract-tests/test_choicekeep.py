import sys,types,json,unittest,copy,functools,importlib.util
from pathlib import Path
class Error(Exception):pass
class Return:
 def __init__(self,v):self.calldata=v
sender=types.SimpleNamespace(sender_address='0x'+'1'*40);answers=[]
def atomic(f):
 @functools.wraps(f)
 def run(self,*a):
  before=copy.deepcopy(self.cases)
  try:return f(self,*a)
  except Exception:self.cases=before;raise
 return run
def nondet(leader,validator):
 v=leader()
 if not validator(Return(v)):raise Error('DISAGREEMENT')
 return v
sys.modules['genlayer']=types.SimpleNamespace(TreeMap=dict,gl=types.SimpleNamespace(Contract=object,message=sender,public=types.SimpleNamespace(write=atomic,view=lambda f:f),vm=types.SimpleNamespace(UserError=Error,Return=Return,run_nondet_unsafe=nondet),nondet=types.SimpleNamespace(exec_prompt=lambda *a,**k:answers.pop(0))))
root=Path(__file__).parents[1];spec=importlib.util.spec_from_file_location('c',root/'contracts/choicekeep.py');c=importlib.util.module_from_spec(spec);spec.loader.exec_module(c)
BASE=[[['1'],[]],[['2'],['0']],[[],[]],[['1','2'],[]],[['3'],['0']],[['3'],['0']],[[],[]]]
class Tests(unittest.TestCase):
 def setUp(self):
  sender.sender_address='0x'+'1'*40;answers.clear();self.p=json.loads((root/'examples/preserved.json').read_text());self.r=c.ChoiceKeep();self.r.register('case',json.dumps(self.p))
 def record(self):return json.loads(self.r.get_case('0x'+'1'*40,'case'))
 def rows(self):return {'rows':[{'kind':'EXACT','moves':copy.deepcopy(m),'quote':s['rule'],'reason':'The rule explicitly lists the complete action successors.'}for m,s in zip(BASE,self.p['left']['states']+self.p['right']['states'])]}
 def assess(self,x=None):
  x=x or self.rows();answers.extend([x,copy.deepcopy(x)]);self.r.compare('0x'+'1'*40,'case')
 def unchanged(self,code,f):
  old=self.record()
  with self.assertRaisesRegex(Error,code):f()
  self.assertEqual(old,self.record())
 def test_equivalent_case_adopts_exact_certificate_once(self):
  self.assess();r=self.record();self.assertEqual(r['state'],'EQUIVALENT');self.r.adopt('case',r['certificate']);self.assertEqual(self.record()['state'],'ADOPTED');self.unchanged('NOT_EQUIVALENT',lambda:self.r.adopt('case',r['certificate']))
 def test_early_fork_witness_requires_matching_every_response(self):
  x=self.rows();x['rows'][4]['moves']=[['3'],[]];x['rows'][5]['moves']=[[],['0']];self.assess(x);r=self.record();self.assertEqual(r['state'],'DISTINGUISHABLE');self.assertEqual(r['proof']['rounds'][2]['removed'][0]['responses'],[['1','1'],['1','2']]);self.unchanged('NOT_EQUIVALENT',lambda:self.r.adopt('case',r['certificate']))
 def test_stale_certificate_and_foreign_owner_fail_closed(self):
  self.assess();self.unchanged('STALE_CERTIFICATE',lambda:self.r.adopt('case','bad'));sender.sender_address='0x'+'2'*40
  with self.assertRaisesRegex(Error,'NOT_FOUND'):self.r.adopt('case',self.record()['certificate'])
 def test_forged_evidence_rejected_without_state_change(self):
  x=self.rows();x['rows'][0]['quote']='This is invented evidence';answers.append(x);self.unchanged('UNSUPPORTED_QUOTE',lambda:self.r.compare('0x'+'1'*40,'case'))
 def test_independent_row_disagreement_rolls_back(self):
  x=self.rows();y=copy.deepcopy(x);y['rows'][5]['moves']=[[],[]];answers.extend([x,y]);self.unchanged('DISAGREEMENT',lambda:self.r.compare('0x'+'1'*40,'case'))
 def test_unknown_has_no_positive_moves_and_blocks(self):
  x=self.rows();x['rows'][5]['kind']='UNKNOWN';x['rows'][5]['moves']=[[],[]];self.assess(x);self.assertEqual(self.record()['state'],'REVIEW');self.unchanged('NOT_EQUIVALENT',lambda:self.r.adopt('case',self.record()['certificate']))
 def test_duplicate_input_and_reassessment_are_rejected(self):
  self.unchanged('ALREADY_EXISTS',lambda:self.r.register('case',json.dumps(self.p)));self.assess();self.unchanged('ALREADY_COMPARED',lambda:self.r.compare('0x'+'1'*40,'case'))
 def test_numeric_and_duplicate_targets_are_invalid(self):
  for targets,error in [([1],'TARGET_INDEX'),(['1','1'],'DUPLICATE_TARGET')]:
   x=self.rows();x['rows'][0]['moves'][0]=targets
   with self.assertRaisesRegex(Error,error):c.parse_rows(x,self.p)
 def test_proof_symmetric_when_sides_swap(self):
  p=json.loads((root/'examples/early-fork.json').read_text());x=self.rows();x['rows'][4]['moves']=[['3'],[]];x['rows'][5]['moves']=[[],['0']];a=c.derive(p,x);p['left'],p['right']=p['right'],p['left'];x['rows']=x['rows'][3:]+x['rows'][:3];b=c.derive(p,x);self.assertEqual(a['outcome'],b['outcome']);self.assertEqual(sorted([list(reversed(v))for v in a['relation']]),sorted(b['relation']))
if __name__=='__main__':unittest.main()
