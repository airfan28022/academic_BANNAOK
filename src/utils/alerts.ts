import Swal from 'sweetalert2';
import confetti from 'canvas-confetti';

// Base toast configuration
const Toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  customClass: {
    popup: 'rounded-2xl shadow-xl border border-slate-100 font-prompt',
  },
  didOpen: (toast) => {
    toast.onmouseenter = Swal.stopTimer;
    toast.onmouseleave = Swal.resumeTimer;
  },
});

export const showToast = (
  icon: 'success' | 'error' | 'warning' | 'info' | 'question',
  title: string,
  text?: string
) => {
  return Toast.fire({
    icon,
    title,
    text,
  });
};

export const showSuccessAlert = (title: string, text?: string) => {
  // Trigger celebration confetti for key milestones
  confetti({
    particleCount: 70,
    spread: 60,
    origin: { y: 0.7 },
  });

  return Swal.fire({
    icon: 'success',
    title,
    text,
    confirmButtonText: 'ตกลง',
    confirmButtonColor: '#7C3AED',
    customClass: {
      popup: 'rounded-3xl p-6 font-prompt shadow-2xl border border-slate-100',
      confirmButton: 'px-6 py-2.5 rounded-xl font-medium btn-glow-purple',
    },
  });
};

export const showErrorAlert = (title: string, text?: string) => {
  return Swal.fire({
    icon: 'error',
    title,
    text,
    confirmButtonText: 'รับทราบ',
    confirmButtonColor: '#EF4444',
    customClass: {
      popup: 'rounded-3xl p-6 font-prompt shadow-2xl border border-slate-100',
      confirmButton: 'px-6 py-2.5 rounded-xl font-medium',
    },
  });
};

export const showWarningAlert = (title: string, text?: string) => {
  return Swal.fire({
    icon: 'warning',
    title,
    text,
    confirmButtonText: 'ตกลง',
    confirmButtonColor: '#F59E0B',
    customClass: {
      popup: 'rounded-3xl p-6 font-prompt shadow-2xl border border-slate-100',
      confirmButton: 'px-6 py-2.5 rounded-xl font-medium btn-glow-amber',
    },
  });
};

export const showInfoAlert = (title: string, text?: string) => {
  return Swal.fire({
    icon: 'info',
    title,
    text,
    confirmButtonText: 'รับทราบ',
    confirmButtonColor: '#7C3AED',
    customClass: {
      popup: 'rounded-3xl p-6 font-prompt shadow-2xl border border-slate-100',
      confirmButton: 'px-6 py-2.5 rounded-xl font-medium btn-glow-purple',
    },
  });
};

export const showConfirmDialog = async (
  title: string,
  text: string,
  confirmText: string = 'ยืนยัน',
  cancelText: string = 'ยกเลิก',
  isDanger: boolean = false
): Promise<boolean> => {
  const result = await Swal.fire({
    title,
    text,
    icon: isDanger ? 'warning' : 'question',
    showCancelButton: true,
    confirmButtonColor: isDanger ? '#EF4444' : '#7C3AED',
    cancelButtonColor: '#94A3B8',
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
    reverseButtons: true,
    customClass: {
      popup: 'rounded-3xl p-6 font-prompt shadow-2xl border border-slate-100',
      confirmButton: `px-6 py-2.5 rounded-xl font-medium ${isDanger ? '' : 'btn-glow-purple'}`,
      cancelButton: 'px-5 py-2.5 rounded-xl font-medium',
    },
  });

  return result.isConfirmed;
};
