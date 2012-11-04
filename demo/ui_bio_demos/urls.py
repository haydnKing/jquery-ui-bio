from django.conf.urls import patterns, include, url
from django.views.generic.simple import direct_to_template

urlpatterns = patterns('',
		
		url(r'^fragment/$', direct_to_template, {'template':"fragment.html",}),
		url(r'^fragmentSelect/$', direct_to_template,
			{'template':'fragmentSelect.html'}),

)
