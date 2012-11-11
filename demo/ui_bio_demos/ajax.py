from django.utils import simplejson
from dajaxice.decorators import dajaxice_register
import dajaxice.views
from django.http import HttpResponseNotFound, HttpResponse

_fragment_sets = [[
        {"name": "Fragment A", "Length": 15, 
					"desc": "Fragment fetched using an AJAX request", 
					"url": "www.bbc.co.uk"},
        {"name": "Fragment B", "Length": 1445, 
					"desc": "Fragment fetched using an AJAX request"},
        {"name": "Fragment C", "Length": 15, 
					"desc": "Fragment fetched using an AJAX request", 
					"url": "www.bbc.co.uk"},
        {"name": "Fragment D", "Length": 15, 
					"desc": "Fragment fetched using an AJAX request", 
					"url": "www.bbc.co.uk"},
        {"name": "Fragment E", "Length": 15, 
					"desc": "Fragment fetched using an AJAX request", 
					"url": "www.bbc.co.uk"},
        {"name": "Fragment F", "Length": 15, 
					"desc": "Fragment fetched using an AJAX request", 
					"url": "www.bbc.co.uk"},
        {"name": "Fragment G", "Length": 15, 
					"desc": "Fragment fetched using an AJAX request", 
					"url": "www.bbc.co.uk"},
        {"name": "Fragment H", "Length": 15, 
					"desc": "Fragment fetched using an AJAX request", 
					"url": "www.bbc.co.uk"},
        {"name": "Fragment I", "Length": 15, 
					"desc": "Fragment fetched using an AJAX request", 
					"url": "www.bbc.co.uk"},
        {"name": "Fragment J", "Length": 15, 
					"desc": "Fragment fetched using an AJAX request", 
					"url": "www.bbc.co.uk"},
        {"name": "Fragment K", "Length": 15,
					"desc": "Fragment fetched using an AJAX request", 
					"url": "www.bbc.co.uk"},
        {"name": "Fragment L", "Length": 15, 
					"desc": "Fragment fetched using an AJAX request", 
					"url": "www.bbc.co.uk"}
],
[
        {"name": "Fragment 1", "Length": 15, 
					"desc": "Fragment fetched using an AJAX request", 
					"url": "www.bbc.co.uk"},
        {"name": "Fragment 2", "Length": 1445, 
					"desc": "Fragment fetched using an AJAX request"},
        {"name": "Fragment 3", "Length": 15, 
					"desc": "Fragment fetched using an AJAX request", 
					"url": "www.bbc.co.uk"},
        {"name": "Fragment 4", "Length": 15, 
					"desc": "Fragment fetched using an AJAX request", 
					"url": "www.bbc.co.uk"},
        {"name": "Fragment 5", "Length": 15, 
					"desc": "Fragment fetched using an AJAX request", 
					"url": "www.bbc.co.uk"},
        {"name": "Fragment 6", "Length": 15, 
					"desc": "Fragment fetched using an AJAX request", 
					"url": "www.bbc.co.uk"},
        {"name": "Fragment 7", "Length": 15, 
					"desc": "Fragment fetched using an AJAX request", 
					"url": "www.bbc.co.uk"},
        {"name": "Fragment 8", "Length": 15, 
					"desc": "Fragment fetched using an AJAX request", 
					"url": "www.bbc.co.uk"},
        {"name": "Fragment 9", "Length": 15, 
					"desc": "Fragment fetched using an AJAX request", 
					"url": "www.bbc.co.uk"},
        {"name": "Fragment 10", "Length": 15, 
					"desc": "Fragment fetched using an AJAX request", 
					"url": "www.bbc.co.uk"},
        {"name": "Fragment 11", "Length": 15, 
					"desc": "Fragment fetched using an AJAX request", 
					"url": "www.bbc.co.uk"},
        {"name": "Fragment 12", "Length": 15, 
					"desc": "Fragment fetched using an AJAX request", 
					"url": "www.bbc.co.uk"}
],
]



#monkey-patch dajaxice response to include content length
dispatch = dajaxice.views.DajaxiceRequest.dispatch

def monkey(self, request, name=None):
	ret = dispatch(self, request, name)
	if isinstance(ret, HttpResponse):
		ret['Content-Length'] = len(ret.content)
	return ret

dajaxice.views.DajaxiceRequest.dispatch = monkey


@dajaxice_register
def fragmentSelect(request, **kwargs):
	num = kwargs.get('num')
	if num > 0 and num <= len(_fragment_sets):
		return simplejson.dumps(_fragment_sets[num-1])
	else:
		return HttpResponseNotFound()
	
import os.path
from Bio import SeqIO
from Bio.SeqRecord import SeqRecord
from Bio.SeqFeature import SeqFeature, FeatureLocation

def get_test_data():
	path = os.path.join(os.path.dirname(__file__),"data/EColi.gb")
	gen = SeqIO.parse(path, 'genbank')
	return gen.next()

@dajaxice_register
def getMetadata(request, **kwargs):
	"""Return metadata and features on EColi"""
	coli = get_test_data()
	ret = {		'name': coli.name,
						'description': coli.description,
						'length': len(coli.seq),
						'alphabet': str(coli.seq.alphabet)[0:-2],
						'features': [],
					}
	for f in coli.features:
		feat = {'start': int(f.location.start),
						'end': int(f.location.end),
						'strand': f.strand,
						'ref': f.ref,
						'ref_db': f.ref_db,
						'type': f.type,
						'id': f.id,
						'qualifiers': {},
						}
		for key,value in f.qualifiers.iteritems():
			feat['qualifiers'][key] = value
		ret['features'].append(feat)
	
	return simplejson.dumps(ret)
	

