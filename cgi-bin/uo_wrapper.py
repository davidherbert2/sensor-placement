# -*- coding: utf-8 -*-
"""
Python wrapper for UO calls

Created on Tue Apr  9 14:35:33 2019

@author: ndh114
"""

import cgi
import requests

print('Content-Type: application/json')
print('')

fs = cgi.FieldStorage()
resp = requests.get(fs['url'].value)
print(resp.text)