// Consultas sobre la base en memoria: no leen almacenamiento ni modifican datos.
export function canAccessPet(pet, user) {
  return pet && user && (
    user.role !== 'owner' || pet.ownerId === user.ownerId
  );
}

export function getPetProfile(db, pet, user) {
  if (!canAccessPet(pet, user)) return null;

  return {
    pet,
    records: db.clinical
      .filter(record =>
        record.petId === pet.id &&
        (user.role !== 'owner' || record.visible)
      )
      .sort((a, b) => b.date.localeCompare(a.date))
  };
}

export function getPetProfileByQr(db, qr, user) {
  if (!qr) return null;
  const pet = db.pets.find(item => item.qr === qr);
  return getPetProfile(db, pet, user);
}
