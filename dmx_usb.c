#include <libusb-1.0/libusb.h>
#include <stdio.h>
#include <stdlib.h>
#include <time.h>
#include <string.h>

#define USB_VENDOR_ID    0x16C0  /* Vendor ID for uDMX */
#define USB_PRODUCT_ID   0x05DC  /* Product ID for uDMX */
#define DMX_CHANNELS     512     /* Total number of DMX channels */

// Function to convert arguments from strings to integers
void convert_args_to_int(int *output, char *argv[], int start_index, int count) {
    for (int i = 0; i < count; i++) {
        output[i] = atoi(argv[start_index + i]);
    }
}

// Open the DMX USB device
libusb_device_handle* open_dmx_device() {
    libusb_device_handle *handle = NULL;
    
    // Initialize libusb
    if (libusb_init(NULL) < 0) {
        fprintf(stderr, "Failed to initialize libusb.\n");
        return NULL;
    }

    // Open the device
    handle = libusb_open_device_with_vid_pid(NULL, USB_VENDOR_ID, USB_PRODUCT_ID);
    if (handle == NULL) {
        fprintf(stderr, "Error: Could not find or open uDMX device.\n");
        libusb_exit(NULL);
        return NULL;
    }

    // Claim the interface
    if (libusb_claim_interface(handle, 0) < 0) {
        fprintf(stderr, "Error: Cannot claim interface.\n");
        libusb_close(handle);
        libusb_exit(NULL);
        return NULL;
    }

    printf("uDMX device opened successfully.\n");
    return handle;
}

// Close the DMX USB device
void close_dmx_device(libusb_device_handle* handle) {
    if (handle) {
        libusb_release_interface(handle, 0);
        libusb_close(handle);
        libusb_exit(NULL);
        printf("uDMX device closed.\n");
    }
}

// Set specific DMX channels to control the light color and intensity
int change_color(int intensity, int red, int green, int blue, int white, int amber, int violet, int strobe, int color_shift) {
    libusb_device_handle *handle = open_dmx_device();
    int ret = 0;
    unsigned char data[10] = {0};
    data[0] = intensity;  // Channel 1: Intensity (brightness)
    data[1] = red;  // Channel 2: Red
    data[2] = green;    // Channel 3: Green
    data[3] = blue;    // Channel 4: Blue
    data[4] = white;    // Channel 5: White
    data[5] = amber;    // Channel 6: Amber
    data[6] = violet;    // Channel 7: Violet
    data[7] = strobe;    // Channel 8: Strobe
    data[8] = color_shift;    // Channel 9: Color Shift
    data[9] = 0;    // Channel 10: Test

    if (!handle) {
        fprintf(stderr, "Failed to initialize libusb\n");
        return ret;
    }

    // Send control transfer to update DMX light values
    ret = libusb_control_transfer(handle,
                                  LIBUSB_ENDPOINT_OUT | LIBUSB_REQUEST_TYPE_VENDOR | LIBUSB_RECIPIENT_DEVICE,
                                  2,              // Command: Set Channel Range
                                  9,              // wValue: 9 channels (Intensity + RGBWAVSV)
                                  0,              // wIndex: Starting at channel 1
                                  data,           // Data buffer with values
                                  sizeof(data),   // Length of data buffer
                                  5000);          // Timeout

    if (ret < 0) {
        fprintf(stderr, "Error sending control message: %s\n", libusb_error_name(ret));
    } else {
        printf("Color updated with Intensity=%d, R=%d, G=%d, B=%d, W=%d, A=%d, V=%d, S=%d, CS=%d\n",
               intensity, red, green, blue, white, amber, violet, strobe, color_shift);
    }

    // Release and close
    close_dmx_device(handle);
    return ret >= 0 ? 0 : ret;
}


int main(int argc, char *argv[]) {
    int result = -1;
    if (argc < 10){
        srand(time(NULL));  // Seed the random number generator with the current time
        result = change_color(32, rand() % 128, rand() % 128, rand() % 128, 0, 0, 0, 0, 0);  // Test values for RGB
        fprintf(stderr, "Usage: %s change_color <intensity> <red> <green> <blue> <white> <amber> <violet> <strobe> <color_shift>\n", argv[0]);
    }   


    if (strcmp(argv[1], "change_color") == 0) {
        int colors[9];
        convert_args_to_int(colors, argv, 2, 9); // Convert args to integers starting from index 2

        // Call change_color with unpacked arguments
        result = change_color(colors[0], colors[1], colors[2], colors[3], 
                   colors[4], colors[5], colors[6], colors[7], colors[8]);
    }
    
    if (result == 0) {
        printf("DMX light color set successfully.\n");
    } else {
        printf("Failed to set DMX light color.\n");
    }
    return result;
}
