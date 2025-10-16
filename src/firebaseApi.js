import { db } from './firebase';
import {
  collection,
  getDocs,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  writeBatch,
  addDoc,
  updateDoc,
} from 'firebase/firestore';

export const fetchScenarios = async () => {
  const scenariosCollection = collection(db, 'scenarios');
  const querySnapshot = await getDocs(scenariosCollection);
  return querySnapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      name: data.name || doc.id, // name 속성이 없으면 doc.id를 사용
      ...data,
    };
  });
};

export const createScenario = async ({ newScenarioName, job }) => {
  const newScenarioRef = doc(db, 'scenarios', newScenarioName);
  const docSnap = await getDoc(newScenarioRef);
  if (docSnap.exists()) {
    throw new Error('A scenario with that name already exists.');
  }
  // 생성 시에는 name 속성을 데이터에 포함
  await setDoc(newScenarioRef, { name: newScenarioName, job, nodes: [], edges: [] });
  return { id: newScenarioName, name: newScenarioName, job, nodes: [], edges: [] };
};

export const renameScenario = async ({ oldScenario, newName, job }) => {
    // ID로 문서를 참조하도록 수정 (name 대신 id 사용)
    const oldDocRef = doc(db, 'scenarios', oldScenario.id);
  
    if (oldScenario.name !== newName) {
      // 이름이 변경되면 새 ID로 문서를 만들고 기존 문서는 삭제
      const newDocRef = doc(db, 'scenarios', newName);
      const newDocSnap = await getDoc(newDocRef);
      if (newDocSnap.exists()) {
        throw new Error('A scenario with that name already exists.');
      }
  
      const oldDocSnap = await getDoc(oldDocRef);
      if (oldDocSnap.exists()) {
        const batch = writeBatch(db);
        // 새 데이터에 name과 job을 명확히 설정
        const newData = { ...oldDocSnap.data(), name: newName, job };
        batch.set(newDocRef, newData);
        batch.delete(oldDocRef);
        await batch.commit();
      } else {
        throw new Error('Original scenario not found.');
      }
    } else {
      // 이름 변경 없이 job 속성만 업데이트
      await updateDoc(oldDocRef, { job });
    }
};

export const deleteScenario = async ({ scenarioId }) => {
  const docRef = doc(db, 'scenarios', scenarioId);
  await deleteDoc(docRef);
};

// --- 💡 추가된 부분 시작 ---
export const cloneScenario = async ({ scenarioToClone, newName }) => {
  const originalDocRef = doc(db, 'scenarios', scenarioToClone.id);
  const newDocRef = doc(db, 'scenarios', newName);

  const newDocSnap = await getDoc(newDocRef);
  if (newDocSnap.exists()) {
    throw new Error('A scenario with that name already exists.');
  }

  const originalDocSnap = await getDoc(originalDocRef);
  if (!originalDocSnap.exists()) {
    throw new Error('The scenario to clone does not exist.');
  }

  const originalData = originalDocSnap.data();
  const newData = {
    ...originalData,
    name: newName,
    job: scenarioToClone.job, // 원본의 job 정보를 유지
  };

  await setDoc(newDocRef, newData);
  return { id: newName, ...newData };
};
// --- 💡 추가된 부분 끝 ---


export const fetchScenarioData = async ({ scenarioId }) => {
  if (!scenarioId) return { nodes: [], edges: [] };
  const scenarioDocRef = doc(db, "scenarios", scenarioId);
  const docSnap = await getDoc(scenarioDocRef);
  if (docSnap.exists()) {
    return docSnap.data();
  }
  console.log(`No such document for scenario: ${scenarioId}!`);
  return { nodes: [], edges: [] };
};

export const saveScenarioData = async ({ scenario, data }) => {
  if (!scenario || !scenario.id) {
    throw new Error('No scenario selected to save.');
  }
  const scenarioDocRef = doc(db, "scenarios", scenario.id);
  await setDoc(scenarioDocRef, data);
};

export const fetchApiTemplates = async () => {
  const templatesCollection = collection(db, 'apiTemplates');
  const querySnapshot = await getDocs(templatesCollection);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const saveApiTemplate = async (templateData) => {
  const templatesCollection = collection(db, 'apiTemplates');
  const docRef = await addDoc(templatesCollection, templateData);
  return { id: docRef.id, ...templateData };
};

export const deleteApiTemplate = async (templateId) => {
  const templateDocRef = doc(db, 'apiTemplates', templateId);
  await deleteDoc(templateDocRef);
};

// Form 템플릿 관련 함수들
export const fetchFormTemplates = async () => {
  const templatesCollection = collection(db, 'formTemplates');
  const querySnapshot = await getDocs(templatesCollection);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const saveFormTemplate = async (templateData) => {
  const templatesCollection = collection(db, 'formTemplates');
  const docRef = await addDoc(templatesCollection, templateData);
  return { id: docRef.id, ...templateData };
};

export const deleteFormTemplate = async (templateId) => {
  const templateDocRef = doc(db, 'formTemplates', templateId);
  await deleteDoc(templateDocRef);
};