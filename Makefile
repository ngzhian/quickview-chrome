all: build

clean:
	rm quickview.zip

build:
	zip -r quickview.zip . -x *.git* \*.zip Makefile **/.DS_Store \.* ss_1.png ss_2.png
