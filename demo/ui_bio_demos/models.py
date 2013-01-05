from django.db import models
from Bio import SeqIO
from Bio.SeqRecord import SeqRecord
from Bio.SeqFeature import SeqFeature
from cStringIO import StringIO
import json

class Fragment(models.Model):
	"""A super-simple model for storing a fragment in the database"""
	data = models.TextField()

	def save_gb(self, rec):
		s = StringIO()
		n = SeqIO.write(rec, s, 'genbank')
		self.data = s.getvalue()
		self.save()
		return n

	def load_gb(self):
		s = StringIO(self.data)
		ret = []
		for req in SeqIO.parse(s, 'genbank'):
			ret.append(req)
		return ret
		
	def to_json(self):
		records = self.load_gb()
		j = {'pk': self.pk, 'frags': list(),}

		for rec in records:
			r = {	'id': rec.id,
						'seq': str(rec.seq),
						'alphabet': str(rec.seq.alphabet),
						'name': rec.name,
						'description': rec.description,
						'features': list(),
						'annotations': rec.annotations,
					}
			for a in rec.annotations:
				r['features'].append({'id': a.id,
															'type': a.type,
															'strand': a.strand,
															'qualifiers': a.qualifiers,
															'start': int(a.position.start),
															'end': int(a.position.end),})
			j['frags'].append(r)
		return json.dumps(j)
		
