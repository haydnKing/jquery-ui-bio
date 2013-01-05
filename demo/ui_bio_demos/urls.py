from django.conf.urls import patterns, include, url
from django.views.generic.simple import direct_to_template

from dajaxice.core import dajaxice_autodiscover, dajaxice_config
dajaxice_autodiscover()

urlpatterns = patterns('',
		
		url(r'^fragment/$', direct_to_template, {'template':"fragment.html",}),
		url(r'^fragmentSelect/$', direct_to_template,
			{'template':'fragmentSelect.html'}),
	url(r'^sequenceView/$', direct_to_template,
			{'template':'sequenceView.html'}),
		url(dajaxice_config.dajaxice_url, include('dajaxice.urls')),
)
