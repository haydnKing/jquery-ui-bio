from django.utils import simplejson as json
from dajaxice.decorators import dajaxice_register
from django.http import HttpResponseNotFound
from Bio import SeqIO
import os.path

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

files = [os.path.join(os.path.dirname(__file__), 'ecoli.gb'),
		]

meta = [{
	'description': "Escherichia coli str. K-12 substr. MG1655, complete genome.",
	'id': "U00096.2",
	'name': "U00096",
	},]

@dajaxice_register
def fragmentSelect(request, **kwargs):
	num = kwargs.get('num')
	if num > 0 and num <= len(_fragment_sets):
		return simplejson.dumps(_fragment_sets[num-1])
	else:
		return HttpResponseNotFound()
		
@dajaxice_register
def getTestMeta(request, **kwargs):
	id = int(kwargs.get('id', 0))
	return json.dumps(meta[id])

@dajaxice_register
def getTestFeatures(request, **kwargs):
	id = int(kwargs.get('id', 0))
	seq = SeqIO.read(files[id], 'genbank')
	ret = []
	for f in seq.features:
		ret += {
				'type': f.type,
				'id': f.id,
				'qualifiers': f.qualifiers,
				'location': {
					'start': int(f.location.start),
					'end':   int(f.location.end),
					'strand': f.location.strand,
					}
				}
	return json.dumps(ret)

