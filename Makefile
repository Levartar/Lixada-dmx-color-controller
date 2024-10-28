CC = gcc
CFLAGS = -Wall
LIBS = -lusb-1.0

all: dmx_usb

dmx_usb: dmx_usb.o
	$(CC) -o dmx_usb dmx_usb.o $(LIBS)

dmx_usb.o: dmx_usb.c
	$(CC) $(CFLAGS) -c dmx_usb.c

clean:
	rm -f dmx_usb.o dmx_usb
