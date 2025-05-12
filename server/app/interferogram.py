import numpy as np
from scipy.fftpack import fft2, ifft2, fftshift, ifftshift
from skimage.restoration import unwrap_phase

def generate_circle_matrix(size, center, radius):
    x, y = np.ogrid[:size[0], :size[1]]
    distance = np.sqrt((x - center[0]) ** 2 + (y - center[1]) ** 2)
    mask = (distance <= radius).astype(np.uint8)
    
    return mask

def gen_hann_filter(size, radius, position):
    diameter = 2 * radius + 1
    mask = np.zeros(size)
    print(mask.shape)

    y, x = position

    hann_1d = 0.5 * (1 - np.cos(2 * np.pi * np.arange(diameter) / (diameter - 1)))
    window = np.outer(hann_1d, hann_1d)
    mask[max(y - radius, 0):min(y + radius + 1, mask.shape[0]), max(x - radius, 0):min(x + radius + 1, mask.shape[1])] = window
    
    return mask

def find_max(matrix, radius):
    rows, cols = matrix.shape
    center_row, center_col = rows // 2, cols // 2

    y, x = np.ogrid[:rows, :cols]
    distances = np.sqrt((y - center_row) ** 2 + (x - center_col) ** 2)

    mask = distances > radius

    max_value = np.max(matrix[mask])
    max_positions = list(zip(*np.where((matrix == max_value) & mask)))

    return max_positions


def get_sign(n):
  return -1 if n < 0 else 1

def sparse(masked_matrix, masked, step=5):
    data = masked_matrix.data if masked else masked_matrix
    mask = masked_matrix.mask if np.ma.is_masked(masked_matrix) else np.zeros_like(data, dtype=bool)
    
    rows, cols = np.indices(data.shape)
    
    step_filter = (rows % step == 0) & (cols % step == 0)
    filtered_rows = rows[step_filter]
    filtered_cols = cols[step_filter]
    filtered_data = data[step_filter]
    filtered_mask = mask[step_filter]
    
    result = np.empty((len(filtered_rows), 3), dtype=object)
    result[:, 0] = filtered_rows
    result[:, 1] = filtered_cols
    result[:, 2] = np.where(filtered_mask, 0, filtered_data)
    
    return result

def restore(interferogram, wavelength, size, angle, mask_radius):
    y_length, x_length = interferogram.shape
  
    if mask_radius:
        x, y = np.ogrid[-(y_length / 2):(y_length / 2), -(x_length / 2):(x_length / 2)]
        mask = x ** 2 + y ** 2 > mask_radius ** 2
        circle = generate_circle_matrix(interferogram.shape, (x_length / 2, y_length / 2), mask_radius + 2)
        interferogram *= circle
  
    transformed = fftshift(fft2(interferogram))

    if wavelength != None and size != None and angle != None:
        x, y = size
        x_angle, y_angle = angle
        if y is None:
            y = x * (y_length / x_length)
        else:
            x = y * (x_length / y_length)
        x_freq = int(np.round(x * 1e-3 * x_angle / (wavelength * 1e-9)) + x_length / 2)
        y_freq = int(np.round(y * 1e-3 * y_angle / (wavelength * 1e-9)) + y_length / 2)
  
    else:
        y_freq, x_freq = find_max(np.abs(transformed), 5)[0]

    sign = get_sign(y_length / 2 - y_freq) * get_sign(x_length / 2 - x_freq)
    hann = gen_hann_filter(interferogram.shape, int(np.sqrt((x_length / 2 - x_freq) ** 2 + (y_length / 2 - y_freq) ** 2)), (y_freq, x_freq))

    transformed *= hann

    transformed = np.roll(transformed, y_length / 2 - y_freq, axis=0)
    transformed = np.roll(transformed, x_length / 2 - x_freq, axis=1)

    wrapped_phase = np.angle(ifft2(ifftshift(transformed)))

    if mask_radius:
        wrapped_phase = np.ma.masked_array(wrapped_phase, mask=mask)

    restored = unwrap_phase(wrapped_phase) * -sign

    return [sparse(restored, bool(mask_radius)), [np.min(restored), np.max(restored)]]
