def seqNumAdv(count):
	r = str(count)
	while(len(r) != 6):
		r = '0' + r
	return r

start_urls = ['http://oeis.org/A' + seqNumAdv(i) + '/list' for i in range(100)] + ['http://oeis.org/A' + seqNumAdv(i) + '/internal' for i in range(100)]

print(start_urls)