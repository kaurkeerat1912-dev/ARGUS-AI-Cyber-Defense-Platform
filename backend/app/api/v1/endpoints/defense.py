"""
Defensive Simulation API Endpoints
Part of Project ARGUS: Automated Countermeasure Simulation & Threat Neutralization
"""

from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete

from backend.app.database.session import get_db
from backend.app.models.investigation import (
    Investigation,
    EvidenceItem,
    BehavioralEvent,
    DefensiveAction,
)
from backend.app.schemas.defense import (
    DefensiveActionSchema,
    DefensePlanResponse,
    ExecuteActionResponse,
    ExecuteAllResponse,
)
from backend.app.services.defense_simulation.engine import defense_simulation_engine

router = APIRouter()


@router.get("/plan/{investigation_id}", response_model=DefensePlanResponse)
async def get_or_create_defense_plan(
    investigation_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Retrieve or synthesize defensive containment plan for the specified investigation.
    """
    # 1. Fetch Investigation
    query = select(Investigation).where(Investigation.id == investigation_id)
    result = await db.execute(query)
    inv = result.scalar_one_or_none()
    if not inv:
        raise HTTPException(status_code=404, detail="Investigation not found")

    # 2. Check if actions already exist or require upgrade
    action_query = select(DefensiveAction).where(DefensiveAction.investigation_id == investigation_id)
    action_res = await db.execute(action_query)
    existing_actions = action_res.scalars().all()

    # Fetch evidence and behavioral telemetry
    ev_query = select(EvidenceItem).where(EvidenceItem.investigation_id == investigation_id)
    ev_res = await db.execute(ev_query)
    evidence_dicts = [
        {"category": e.category, "observed_value": e.observed_value, "severity": e.severity}
        for e in ev_res.scalars().all()
    ]

    bev_query = select(BehavioralEvent).where(BehavioralEvent.investigation_id == investigation_id)
    bev_res = await db.execute(bev_query)
    bev_dicts = [
        {
            "process_name": b.process_name,
            "process_id": b.process_id,
            "command_line": b.command_line,
            "destination_ip": b.destination_ip,
            "domain": b.domain,
        }
        for b in bev_res.scalars().all()
    ]

    plan_data = defense_simulation_engine.generate_defense_plan_data(
        investigation_id=inv.id,
        sample_name=inv.original_name,
        sha256=inv.sha256,
        file_type=inv.file_type or "Unknown",
        risk_score=inv.risk_score,
        evidence_items=evidence_dicts,
        behavioral_events=bev_dicts,
        risk_level=inv.risk_level
    )

    needs_rebuild = False
    if not existing_actions:
        needs_rebuild = True
    else:
        cats = {a.category for a in existing_actions}
        if "SANDBOX_ISOLATION" not in cats and "ACCESS_REVOCATION" not in cats and "CONTINUOUS_MONITORING" not in cats:
            needs_rebuild = True

    if needs_rebuild:
        if existing_actions:
            await db.execute(delete(DefensiveAction).where(DefensiveAction.investigation_id == investigation_id))
            await db.commit()

        for act in plan_data["actions"]:
            db_act = DefensiveAction(
                id=act["id"],
                investigation_id=inv.id,
                category=act["category"],
                title=act["title"],
                description=act["description"],
                target=act["target"],
                rule_syntax=act["rule_syntax"],
                status=act["status"],
                risk_reduction=act["risk_reduction"],
                simulated_output=act.get("simulated_output"),
            )
            db.add(db_act)

        await db.commit()

        # Re-fetch persisted actions
        action_res = await db.execute(action_query)
        existing_actions = action_res.scalars().all()

    # Calculate current posture
    actions_dicts = [
        {
            "id": a.id,
            "status": a.status,
            "risk_reduction": a.risk_reduction,
            "category": a.category,
            "rule_syntax": a.rule_syntax,
        }
        for a in existing_actions
    ]
    posture = defense_simulation_engine.calculate_posture(inv.risk_score, actions_dicts)
    rules_bundle = defense_simulation_engine.bundle_rules(actions_dicts)

    return DefensePlanResponse(
        investigation_id=inv.id,
        sample_name=inv.original_name,
        file_type=inv.file_type or "Unknown",
        initial_risk_score=inv.risk_score,
        initial_risk_level=inv.risk_level,
        primary_strategy=plan_data["primary_strategy"],
        strategy_title=plan_data["strategy_title"],
        strategy_badge=plan_data["strategy_badge"],
        strategy_description=plan_data["strategy_description"],
        mitigated_risk_score=posture["mitigated_risk_score"],
        residual_risk_level=posture["residual_risk_level"],
        efficacy_percentage=posture["efficacy_percentage"],
        total_actions=posture["total_actions"],
        enforced_actions=posture["enforced_actions"],
        actions=existing_actions,
        generated_rules=rules_bundle,
        file_specific_summary=plan_data["file_specific_summary"],
    )


@router.post("/action/{investigation_id}/{action_id}/execute", response_model=ExecuteActionResponse)
async def execute_defense_action(
    investigation_id: str,
    action_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Simulate execution and validation of a specific defensive countermeasure.
    """
    # 1. Fetch Investigation
    inv_query = select(Investigation).where(Investigation.id == investigation_id)
    inv_res = await db.execute(inv_query)
    inv = inv_res.scalar_one_or_none()
    if not inv:
        raise HTTPException(status_code=404, detail="Investigation not found")

    # 2. Fetch Target Action
    action_query = select(DefensiveAction).where(
        DefensiveAction.id == action_id,
        DefensiveAction.investigation_id == investigation_id
    )
    action_res = await db.execute(action_query)
    action = action_res.scalar_one_or_none()
    if not action:
        raise HTTPException(status_code=404, detail="Defensive action not found")

    # 3. Simulate execution
    action_dict = {
        "id": action.id,
        "category": action.category,
        "title": action.title,
        "target": action.target,
        "risk_reduction": action.risk_reduction,
        "status": action.status,
    }
    updated_dict, sim_logs = defense_simulation_engine.simulate_action_execution(
        action=action_dict,
        sample_name=inv.original_name
    )

    action.status = updated_dict["status"]
    action.simulated_output = updated_dict["simulated_output"]
    action.executed_at = updated_dict["executed_at"]

    await db.commit()
    await db.refresh(action)

    # 4. Fetch all actions to compute updated posture
    all_query = select(DefensiveAction).where(DefensiveAction.investigation_id == investigation_id)
    all_res = await db.execute(all_query)
    all_actions = all_res.scalars().all()
    actions_dicts = [
        {"status": a.status, "risk_reduction": a.risk_reduction}
        for a in all_actions
    ]
    posture = defense_simulation_engine.calculate_posture(inv.risk_score, actions_dicts)

    return ExecuteActionResponse(
        status="SUCCESS",
        action=action,
        updated_mitigated_risk_score=posture["mitigated_risk_score"],
        updated_residual_risk_level=posture["residual_risk_level"],
        efficacy_percentage=posture["efficacy_percentage"],
        simulation_log=sim_logs,
    )


@router.post("/{investigation_id}/execute-all", response_model=ExecuteAllResponse)
async def execute_all_defense_actions(
    investigation_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Simulate full sequential execution of all proposed defensive countermeasures.
    """
    inv_query = select(Investigation).where(Investigation.id == investigation_id)
    inv_res = await db.execute(inv_query)
    inv = inv_res.scalar_one_or_none()
    if not inv:
        raise HTTPException(status_code=404, detail="Investigation not found")

    # Fetch all actions
    all_query = select(DefensiveAction).where(DefensiveAction.investigation_id == investigation_id)
    all_res = await db.execute(all_query)
    actions = all_res.scalars().all()

    if not actions:
        # Create plan first if none exists
        await get_or_create_defense_plan(investigation_id=investigation_id, db=db)
        all_res = await db.execute(all_query)
        actions = all_res.scalars().all()

    full_logs: List[str] = [
        f"[*] --- COMMENCING ARGUS AUTOMATED DEFENSIVE SIMULATION ---",
        f"[*] Target Sample: {inv.original_name} (Risk: {inv.risk_score}/100)",
        f"[*] Actions in Queue: {len(actions)}"
    ]

    executed_count = 0
    for action in actions:
        action_dict = {
            "id": action.id,
            "category": action.category,
            "title": action.title,
            "target": action.target,
            "risk_reduction": action.risk_reduction,
            "status": action.status,
        }
        updated_dict, sim_logs = defense_simulation_engine.simulate_action_execution(
            action=action_dict,
            sample_name=inv.original_name
        )
        action.status = updated_dict["status"]
        action.simulated_output = updated_dict["simulated_output"]
        action.executed_at = updated_dict["executed_at"]
        full_logs.extend(sim_logs)
        executed_count += 1

    await db.commit()

    # Re-fetch updated
    all_res = await db.execute(all_query)
    updated_actions = all_res.scalars().all()
    actions_dicts = [
        {"status": a.status, "risk_reduction": a.risk_reduction}
        for a in updated_actions
    ]
    posture = defense_simulation_engine.calculate_posture(inv.risk_score, actions_dicts)

    full_logs.extend([
        f"[*] --- SIMULATION RUN COMPLETE ---",
        f"[*] Initial Threat Risk: {inv.risk_score}/100 ({inv.risk_level})",
        f"[*] Residual Posture: {posture['mitigated_risk_score']}/100 ({posture['residual_risk_level']})",
        f"[*] Threat Mitigation Efficacy: {posture['efficacy_percentage']}%"
    ])

    return ExecuteAllResponse(
        status="SUCCESS",
        executed_count=executed_count,
        initial_risk_score=inv.risk_score,
        final_mitigated_risk_score=posture["mitigated_risk_score"],
        final_risk_level=posture["residual_risk_level"],
        overall_efficacy_percentage=posture["efficacy_percentage"],
        actions=updated_actions,
        full_simulation_log=full_logs,
    )


@router.post("/{investigation_id}/reset", response_model=DefensePlanResponse)
async def reset_defense_simulation(
    investigation_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Reset all defensive actions for an investigation back to PROPOSED state.
    """
    await db.execute(delete(DefensiveAction).where(DefensiveAction.investigation_id == investigation_id))
    await db.commit()

    return await get_or_create_defense_plan(investigation_id=investigation_id, db=db)
