import { personName, emailAddress, passwordValue } from './validation.js';
import { roleNames } from './permissions.js';
import { STORAGE_KEY as KEY, browserStorage } from './storageService.js';
export const VERIFICATION_CODE = '123456';
const CODE = VERIFICATION_CODE;
export function verifyCode(value) {
  if (value !== CODE) throw new Error('El código de verificación es incorrecto.');
}
export function prepareAdministrator(data) {
  personName(data.first);
  personName(data.last);
  data.email = emailAddress(data.email);
  data.password = passwordValue(data.password);
  if (data.password !== data.confirm) {
    throw new Error('Las contraseñas no coinciden.');
  }

  return {
    name: data.first.trim() + ' ' + data.last.trim(),
    email: data.email.trim(),
    password: data.password
  };
}
export function createAuthService({ state, find, isAdmin, commit, lockedRole = null, storage = browserStorage }) {
  const LOCKED_ROLE = lockedRole;
  function isAccountEnabled(account) {
    return Boolean(account?.active && Object.hasOwn(roleNames, account.role) &&
      (account.role !== 'vet' || find('vets', account.vetId)?.active) &&
      (account.role !== 'owner' || find('owners', account.ownerId)?.active));
  }

  function signIn(data) {
    const account = state.db.users.find(item =>
      item.active &&
      item.email.toLowerCase() === data.email.trim().toLowerCase() &&
      item.password === data.password
    );

    if (!isAccountEnabled(account)) {
      throw new Error('Las credenciales son incorrectas o la cuenta está inactiva.');
    }

    if (LOCKED_ROLE && account.role !== LOCKED_ROLE) {
      throw new Error('Esta página es de uso exclusivo del rol ' +
        (roleNames[LOCKED_ROLE] || LOCKED_ROLE) + '.');
    }

    state.user = account;

    commit(() => {
      account.lastAccess = new Date().toISOString();
    });

    try {
      if (data.remember) {
        storage.setItem(KEY + '-email', account.email);
      } else {
        storage.removeItem(KEY + '-email');
      }
    } catch {
      // El inicio de sesión puede continuar sin recordar el usuario.
    }

    return account;
  }
  function recover(data) {
    if (!state.recovery) {
      const account = state.db.users.find(item =>
        item.email.toLowerCase() === data.contact.trim().toLowerCase() ||
        (
        item.ownerId &&
        find('owners', item.ownerId)?.phone === data.contact.trim()
        )
      );

      if (!account) {
        throw new Error('No se encontró una cuenta para ese contacto.');
      }

      state.recovery = {
        id: account.id,
        verified: false
      };

      return 'contact';
    } else if (!state.recovery.verified) {
      verifyCode(data.code);

      state.recovery.verified = true;
      return 'verified';
    } else {
      passwordValue(data.password);
      if (data.password !== data.confirm) {
        throw new Error('Las contraseñas no coinciden.');
      }

      if (commit(() => {
        find('users', state.recovery.id).password = data.password;
      })) {
        return 'updated';
      }
    }
  }
  function resetPassword(accountId, data) {
    if (!isAdmin()) return;

    passwordValue(data.password);
    if (!find('users', accountId)) throw new Error('La cuenta ya no está disponible.');

    if (data.adminPassword !== state.user.password) {
      throw new Error('Tu contraseña de administrador es incorrecta.');
    }

    if (data.password !== data.confirm) {
      throw new Error('Las contraseñas no coinciden.');
    }

    if (commit(() => {
      find('users', accountId).password = data.password;
    })) {
      return true;
    }
  }
  return { signIn, recover, resetPassword, isAccountEnabled };
}
