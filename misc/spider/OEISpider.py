import json
import scrapy
import logging 
import pymongo

db = pymongo.MongoClient("localhost",27017).Numberscope
logging.getLogger('scrapy').setLevel(logging.WARNING)


def seqNumAdv(count):
	r = str(count)
	while(len(r) != 6):
		r = '0' + r
	return r

class ospider(scrapy.Spider):

	name = 'spy'
	# start_urls = ['http://oeis.org/A004018/internal','http://oeis.org/A004018/list']
	#currently on ~A184000
	start_urls = ['http://oeis.org/A' + seqNumAdv(i) + '/list' for i in range(183000,999999)] + ['http://oeis.org/A' + seqNumAdv(i) + '/internal' for i in range(999999)]
	
	def parse(self,response):
		print(response.request.url[16:23])
		if 'internal' in response.request.url:
			#get the name from here
			raw = response.css('tt::text').extract()
			#now find the tag which starts with %N; i.e. the name of the sequence
			desc = ''
			for elt in raw:
				if (elt[0] == '%') and (elt[1] == 'N'):
					#this one
					desc = elt
			oeisid = response.request.url[16:23]
			existing = db.Sequences.find_one({'OEISID':oeisid})
			if existing is not None:
				# print(existing)
				db.Sequences.update_one({'_id':existing['_id']},{'$set':{'description':desc[3:]}})
			else:
				db.Sequences.insert_one({"OEISID":oeisid,"description":desc[3:],"nterms":None,"generateFunctionRef":"UNDEFINED"})
		else:
			raw = response.css('pre::text').extract()
			r1 = raw
			seq = []

			if raw:
				raw[0].replace("\n","")
				i = 0
				while(i < len(raw[0])):
					if raw[0][i] == '\\':
						#current is wrapped
						rawt = raw[0][:i] + raw[0][i+3:]
						raw[0] = rawt
					i += 1
				try:
					seq = json.loads(raw[0])
				except:
					print(response.request.url)
					print(raw[0])

				for i in range(len(seq)):
					seq[i] = str(seq[i])
				oeisid = response.request.url[16:23]
				existing = db.Sequences.find_one({'OEISID':oeisid})
				if existing is not None:
					# print(existing)
					db.Sequences.update_one({'_id':existing['_id']},{'$set':{'nterms':seq}})
				else:
					db.Sequences.insert_one({"OEISID":oeisid,"description":'MISSING',"nterms":seq,"generateFunctionRef":"UNDEFINED"})
				#TODO: add parsing of description from webpage
				# db.insertOne({"OEISID":response.request.url[16:22],"description":"MISSING","nterms":seq,"generateFunctionRef":"UNDEFINED"})
